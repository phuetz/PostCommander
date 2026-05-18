import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config/env.js';
import { getDrizzle } from '../db/connection.js';
import { outreachCampaigns, outreachProspects, outreachSequenceSteps } from '../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import { generateText } from 'ai';
import { createModel } from '../services/llm/provider-factory.js';
import { sharedRedisConnection } from '../utils/redis.js';
import { memoryService } from '../services/memory/memory.service.js';
import { Stagehand } from '@browserbasehq/stagehand';
import { liveActivity } from '../services/live-activity.js';
import { Resend } from 'resend';

const resend = new Resend(config.RESEND_API_KEY);

const connection = sharedRedisConnection;

export const outreachWorker = new Worker(
  'outreach-campaigns',
  async (job: Job) => {
    logger.info(`[OutreachWorker] Starting outreach sequence cycle ${job.id}`);

    try {
      const db = getDrizzle();
      const campaigns = await db
        .select()
        .from(outreachCampaigns)
        .where(eq(outreachCampaigns.status, 'active'));

      logger.info(`[OutreachWorker] Found ${campaigns.length} active campaigns`);
      await liveActivity.broadcast('outreach', `Démarrage du cycle d'outreach. Campagnes actives : ${campaigns.length}`);

      for (const campaign of campaigns) {
        // Step 1: Simulated Discovery based on targetActivity or targetKeywords
        const contextTarget = campaign.targetActivity || campaign.targetKeywords;
        const newProspectsCount = Math.floor(Math.random() * 2); // 0 or 1 per cycle for demo
        for (let i = 0; i < newProspectsCount; i++) {
          await db.insert(outreachProspects).values({
            id: crypto.randomUUID(),
            campaignId: campaign.id,
            profileName: `Prospect ${crypto.randomBytes(2).toString('hex')} (${contextTarget})`,
            profileBio: `A very interesting bio matching ${contextTarget}`,
            status: 'discovered',
            replyStatus: 'none',
            currentStepNumber: 1,
            threadContext: '[]',
          });
        }
        if (newProspectsCount > 0) {
          logger.info(`[OutreachWorker] Discovered ${newProspectsCount} new prospects for campaign ${campaign.name}`);
        }

        // Fetch sequence steps for this campaign
        const steps = await db
          .select()
          .from(outreachSequenceSteps)
          .where(eq(outreachSequenceSteps.campaignId, campaign.id))
          .orderBy(asc(outreachSequenceSteps.stepNumber));

        // If no steps defined, fallback to a default step 1
        const activeSteps = steps.length > 0 ? steps : [{
          stepNumber: 1,
          delayDays: 0,
          promptTemplate: `You are a professional outreach assistant. Your goal is: ${campaign.campaignGoal}. Write a short, engaging, and highly personalized ${campaign.platform} message. Return ONLY the message content.`
        }];

        // Step 2: Message Generation & Sending (Drip Engine)
        const prospects = await db
          .select()
          .from(outreachProspects)
          .where(and(eq(outreachProspects.campaignId, campaign.id), eq(outreachProspects.replyStatus, 'none')));

        const contactedToday = prospects.filter((p: any) => {
          if (!p.sentAt) return false;
          return new Date(p.sentAt).toDateString() === new Date().toDateString();
        }).length;

        let remainingLimit = campaign.dailyLimit - contactedToday;
        const now = new Date();

        // Filter prospects that need action today
        const actionableProspects = prospects.filter((p: any) => {
          const currentStep = activeSteps.find(s => s.stepNumber === p.currentStepNumber);
          if (!currentStep) return false; // Sequence completed

          if (p.status === 'discovered') return true; // Needs step 1

          if (p.status === 'contacted' && p.lastContactedAt) {
            const lastContact = new Date(p.lastContactedAt);
            const diffDays = (now.getTime() - lastContact.getTime()) / (1000 * 3600 * 24);
            return diffDays >= currentStep.delayDays;
          }

          return false;
        });

        logger.info(`[OutreachWorker] Campaign ${campaign.name}: ${actionableProspects.length} actionable prospects. Capacity remaining: ${remainingLimit}`);

        let stagehand: Stagehand | null = null;
        let page: any = null;

        for (const prospect of actionableProspects.slice(0, remainingLimit)) {
          const currentStep = activeSteps.find(s => s.stepNumber === prospect.currentStepNumber);
          if (!currentStep) continue;

          logger.info(`[OutreachWorker] Generating step ${currentStep.stepNumber} message for prospect ${prospect.profileName}`);
          await liveActivity.broadcast('outreach', `Traitement du prospect : ${prospect.profileName} (Etape ${currentStep.stepNumber})`);
          
          try {
            const threadContext = JSON.parse(prospect.threadContext || '[]');
            const historyString = threadContext.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');

            // 🧠 Extract Long-Term Memory from Mem0
            let memoryContext = 'No long term memory available for this prospect.';
            
            try {
              const recalled = await memoryService.recall(prospect.id, 'preferences and facts about this prospect', 5);
              if (recalled && recalled !== 'No context available.') {
                memoryContext = recalled;
                logger.info(`[Mem0] Injected memories for prospect ${prospect.profileName}`);
              }
            } catch (memErr) {
              logger.error({ err: memErr }, '[Mem0] Failed to fetch memories');
            }

            const systemPrompt = `
              ${currentStep.promptTemplate}
              
              Prospect Name: ${prospect.profileName}
              Prospect Bio: ${prospect.profileBio}
              Platform: ${campaign.platform}
              
              🧠 LONG-TERM MEMORY (Facts & Preferences):
              ${memoryContext}
              
              Conversation History so far:
              ${historyString ? historyString : 'No previous messages (First contact).'}
              
              Return ONLY the message content to send right now.
            `;

            const model = await createModel('openai', 'gpt-4o');
            const { text } = await generateText({
              model,
              messages: [{ role: 'system', content: systemPrompt }],
            });
            const generatedMessage = text.trim();

            // 🚀 Stagehand Browser Automation Execution
            if (!stagehand) {
              const stagehandEnv = config.BROWSERBASE_API_KEY ? 'BROWSERBASE' : 'LOCAL';
              stagehand = new Stagehand({
                env: stagehandEnv,
                apiKey: config.BROWSERBASE_API_KEY,
                projectId: config.BROWSERBASE_PROJECT_ID,
                logger: (message: any) => logger.info(`[Stagehand] ${message.message || JSON.stringify(message)}`),
              });
              await stagehand.init();
              page = stagehand.context.activePage() || await stagehand.context.newPage();
              
              // Inject LinkedIn Cookie if available
              if (config.LINKEDIN_SESSION_COOKIE) {
                await stagehand.context.addCookies([{
                  name: 'li_at',
                  value: config.LINKEDIN_SESSION_COOKIE,
                  url: 'https://www.linkedin.com',
                  secure: true,
                  httpOnly: true
                }]);
                logger.info('[Stagehand] LinkedIn session cookie injected');
              } else {
                logger.warn('[Stagehand] No LINKEDIN_SESSION_COOKIE found. Navigation might be blocked by login walls.');
              }
            }

            if (campaign.platform.toLowerCase() === 'linkedin') {
              logger.info(`[Stagehand] Navigating to search for ${prospect.profileName}`);
              await liveActivity.broadcast('outreach', `Navigation vers le profil de ${prospect.profileName} sur LinkedIn...`);
              await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(prospect.profileName)}`);
              
              // 🌍 Multi-language adaptation (defaulting to English, but flexible)
              const locale = (campaign as any).targetLanguage || 'English';
              await liveActivity.broadcast('outreach', `Analyse visuelle : Recherche du bouton Message/Connecter...`);
              const act1 = await stagehand.act(
                `Look for a person matching the bio: "${prospect.profileBio}". Click their "Message" or "Connect" button. The page might be in ${locale}. If not found, do nothing.`
              );
              logger.info(`[Stagehand] Prospect locate result: ${act1.message}`);

              await liveActivity.broadcast('outreach', `Saisie du message personnalisé généré par l'IA...`);
              const act2 = await stagehand.act(
                `Type the following message into the active message or connection request box: "${generatedMessage}". Do not send it yet, just type it.`
              );
              logger.info(`[Stagehand] Message typing result: ${act2.message}`);

              if (!config.OUTREACH_DRY_RUN) {
                await liveActivity.broadcast('outreach', `Envoi du message en cours...`);
                const act3 = await stagehand.act(
                  "Click the 'Send' button to deliver the message."
                );
                logger.info(`[Stagehand] Message send result: ${act3.message}`);
              } else {
                logger.info('[Stagehand] DRY RUN: Skipping the Send button click.');
                await stagehand.act("Click the 'Close' button or click outside to discard the draft.");
              }
            } else if (campaign.platform.toLowerCase() === 'email') {
              logger.info(`[OutreachWorker] Sending email to ${prospect.profileName}`);
              await liveActivity.broadcast('outreach', `Envoi de l'email à ${prospect.profileName}...`);
              
              if (!config.RESEND_API_KEY) {
                throw new Error("RESEND_API_KEY is not configured. Cannot send emails.");
              }
              
              // Extract email from bio or metadata if possible, otherwise skip or use a dummy for dry run
              const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
              const match = prospect.profileBio.match(emailRegex);
              const targetEmail = match ? match[1] : null;
              
              if (!targetEmail && !config.OUTREACH_DRY_RUN) {
                throw new Error(`No email address found in profile bio for ${prospect.profileName}`);
              }
              
              // Generate subject line using a small LLM call
              const { text: subjectText } = await generateText({
                model: await createModel('openai', 'gpt-4o'),
                messages: [{ role: 'system', content: `Generate a short, catchy email subject line for this message: "${generatedMessage}". Return ONLY the subject line.` }],
              });
              
              if (!config.OUTREACH_DRY_RUN && targetEmail) {
                await resend.emails.send({
                  from: config.RESEND_FROM,
                  to: [targetEmail],
                  subject: subjectText.replace(/['"]/g, '').trim(),
                  html: `<p>${generatedMessage.replace(/\n/g, '<br>')}</p>`,
                });
                logger.info(`[OutreachWorker] Email sent to ${targetEmail}`);
              } else {
                logger.info(`[OutreachWorker] DRY RUN: Skipping email send to ${targetEmail || 'unknown'}`);
              }
            } else {
              logger.info(`[Stagehand] Automation for platform ${campaign.platform} is not fully supported yet. Simulating send.`);
            }

            // Update thread context
            threadContext.push({ role: 'assistant', content: generatedMessage, timestamp: now.toISOString() });

            // Advance step
            const nextStepNumber = prospect.currentStepNumber + 1;

            await db
              .update(outreachProspects)
              .set({
                status: 'contacted',
                generatedMessage: generatedMessage,
                sentAt: now.toISOString(),
                lastContactedAt: now.toISOString(),
                currentStepNumber: nextStepNumber,
                threadContext: JSON.stringify(threadContext),
              })
              .where(eq(outreachProspects.id, prospect.id));

            logger.info(`[OutreachWorker] Successfully advanced prospect ${prospect.profileName} to step ${nextStepNumber}`);
            await liveActivity.broadcast('outreach', `✅ Prospect ${prospect.profileName} traité avec succès.`, 'success');
          } catch (err) {
            logger.error({ err }, `[OutreachWorker] Failed to generate or send message for prospect ${prospect.id}`);
            await liveActivity.broadcast('outreach', `❌ Erreur lors du traitement de ${prospect.id}`, 'error');
          }
        }

        if (stagehand) {
          await stagehand.close();
          logger.info(`[Stagehand] Browser session closed for campaign ${campaign.name}`);
        }
      }

      logger.info(`[OutreachWorker] Completed sequence cycle`);
    } catch (error) {
      logger.error({ err: error }, `[OutreachWorker] Error processing job:`);
      throw error;
    }
  },
  { connection: connection as any },
);

outreachWorker.on('failed', (job, err) => {
  logger.error({ err }, `[OutreachWorker] Job ${job?.id} failed`);
});

export async function startOutreachWorker() {
  const { outreachQueue } = await import('../services/jobs/queue.js');
  
  // Clean up old repeatable jobs if any to prevent duplicates
  const repeatableJobs = await outreachQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await outreachQueue.removeRepeatableByKey(job.key);
  }

  // Run every 2 hours to discover and process sending
  await outreachQueue.add('outreach-processing', {}, {
    repeat: {
      pattern: '0 */2 * * *', // Every 2 hours
    },
  });
  
  // Also run immediately on boot for dev testing
  await outreachQueue.add('outreach-processing-now', {});
  
  logger.info('[OutreachWorker] Scheduled outreach cycle');
}
