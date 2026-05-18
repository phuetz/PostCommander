import type { Request, Response } from 'express';
import { getDrizzle } from '../db/connection.js';
import { outreachCampaigns, outreachProspects, outreachSequenceSteps, outreachReplies } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { catchAsync } from '../utils/catch-async.js';
import { AppError } from '../middleware/error-handler.js';
import { requireRequestUser } from '../utils/request-user.js';
import crypto from 'crypto';
import { CreateOutreachCampaignSchema, UpdateOutreachCampaignSchema } from '@postcommander/shared';
import { memoryService } from '../services/memory/memory.service.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createModel } from '../services/llm/provider-factory.js';
import { searchWeb } from '../services/web-search.js';
import { runOSINTHack } from '../services/agent/osint-hack.js';
import { generateDeepDossier } from '../services/agent/deep-dossier.js';
import { generateEmpathicIcebreaker } from '../services/agent/empathy-synthesizer.js';
import { findContact } from '../services/agent/contact-finder.js';
import { extractLinkedInProfile } from '../services/agent/profile-enricher.js';

export const handleGetCampaigns = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  
  const campaigns = await db
    .select()
    .from(outreachCampaigns)
    .where(eq(outreachCampaigns.userId, requestUser.id));

  // Also fetch simple stats: total prospects and prospects contacted for each campaign
  const campaignsWithStats = await Promise.all(campaigns.map(async (campaign) => {
    const prospects = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.campaignId, campaign.id));
      
    const discovered = prospects.filter(p => p.status === 'discovered').length;
    const contacted = prospects.filter(p => p.status === 'contacted').length;
    
    return {
      ...campaign,
      stats: {
        totalProspects: prospects.length,
        discovered,
        contacted,
      }
    };
  }));

  res.json({ success: true, data: campaignsWithStats });
});

export const handleCreateCampaign = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const validatedData = CreateOutreachCampaignSchema.parse(req.body);

  const newCampaign = {
    id: crypto.randomUUID(),
    userId: requestUser.id,
    workspaceId: req.workspaceId as string,
    name: validatedData.name,
    targetKeywords: validatedData.targetKeywords,
    targetActivity: validatedData.targetActivity || null,
    campaignGoal: validatedData.campaignGoal,
    platform: validatedData.platform,
    dailyLimit: validatedData.dailyLimit,
    status: 'active',
  };

  const db = getDrizzle();
  await db.insert(outreachCampaigns).values(newCampaign);

  // If the client passed sequence steps, insert them. Otherwise, insert a default step 1.
  const steps = req.body.steps || [{ stepNumber: 1, delayDays: 0, promptTemplate: `Write a short, engaging, and highly personalized ${validatedData.platform} message for a prospect to achieve: ${validatedData.campaignGoal}.` }];
  
  for (const step of steps) {
    await db.insert(outreachSequenceSteps).values({
      id: crypto.randomUUID(),
      campaignId: newCampaign.id,
      stepNumber: step.stepNumber,
      delayDays: step.delayDays,
      promptTemplate: step.promptTemplate,
    });
  }

  res.status(201).json({ success: true, data: newCampaign });
});

export const handleUpdateCampaign = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;
  const updates = UpdateOutreachCampaignSchema.parse(req.body);

  const db = getDrizzle();
  const [existing] = await db
    .select()
    .from(outreachCampaigns)
    .where(and(eq(outreachCampaigns.id, id as string), eq(outreachCampaigns.userId, requestUser.id)));

  if (!existing) {
    throw new AppError(404, 'Campaign not found');
  }

  const [updated] = await db
    .update(outreachCampaigns)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(outreachCampaigns.id, id as string))
    .returning();

  res.json({ success: true, data: updated });
});

export const handleDeleteCampaign = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;

  const db = getDrizzle();
  await db
    .delete(outreachCampaigns)
    .where(and(eq(outreachCampaigns.id, id as string), eq(outreachCampaigns.userId, requestUser.id)));

  res.json({ success: true });
});

export const handleGetCampaignProspects = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;

  const db = getDrizzle();
  
  // Verify campaign belongs to user
  const [existing] = await db
    .select()
    .from(outreachCampaigns)
    .where(and(eq(outreachCampaigns.id, id as string), eq(outreachCampaigns.userId, requestUser.id)));

  if (!existing) {
    throw new AppError(404, 'Campaign not found');
  }

  const prospects = await db
    .select()
    .from(outreachProspects)
    .where(eq(outreachProspects.campaignId, id as string));

  res.json({ success: true, data: prospects });
});

export const handleSimulateReply = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params; // prospectId
  const { content } = req.body;

  const db = getDrizzle();
  
  const [prospect] = await db
    .select()
    .from(outreachProspects)
    .where(eq(outreachProspects.id, id as string));

  if (!prospect) {
    throw new AppError(404, 'Prospect not found');
  }

  // Insert reply
  const replyId = crypto.randomUUID();
  await db.insert(outreachReplies).values({
    id: replyId,
    prospectId: prospect.id,
    content: content || 'Simulated positive reply',
  });

  // Update prospect to stop sequence and update thread context
  const threadContext = JSON.parse(prospect.threadContext || '[]');
  threadContext.push({ role: 'user', content: content || 'Simulated positive reply', timestamp: new Date().toISOString() });

  await db
    .update(outreachProspects)
    .set({
      replyStatus: 'replied_positive',
      threadContext: JSON.stringify(threadContext),
    })
    .where(eq(outreachProspects.id, prospect.id));

  // Add memory to Mem0 using our centralized service
  const memoryContent = `Prospect ${prospect.profileName} replied with: "${content || 'Simulated positive reply'}". Context: we reached out for ${prospect.campaignId}.`;
  await memoryService.memorize(prospect.id, memoryContent, { type: 'reply', campaignId: prospect.campaignId });

  res.json({ success: true, message: 'Simulated reply processed successfully' });
});

export const handleOSINTScan = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { imageBase64, deepScan } = req.body;

  if (!imageBase64) {
    throw new AppError(400, 'imageBase64 is required');
  }

  // Ensure it's formatted as a data URI if it's just raw base64
  let dataUri = imageBase64;
  if (!imageBase64.startsWith('data:image')) {
    // Attempt to guess format or default to jpeg
    dataUri = `data:image/jpeg;base64,${imageBase64}`;
  }

  if (deepScan) {
    logger.info(`[OSINT] Starting deep scan (Stagehand/Yandex) for user ${requestUser.id}`);
    const result = await runOSINTHack(dataUri);
    return res.json({
      success: true,
      data: result
    });
  }

  logger.info(`[OSINT] Starting vision scan for user ${requestUser.id}`);

  // 1. Analyze the image with GPT-4o Vision to extract context
  const model = await createModel('openai', 'gpt-4o');
  
  const scanResultSchema = z.object({
    extractedText: z.array(z.string()).describe("Any text found on badges, lanyards, screens, or backgrounds"),
    estimatedProfession: z.string().describe("Guessed profession or context based on clothing and environment"),
    companyOrEvent: z.string().optional().describe("Deduced company name or event name if visible"),
    searchQuery: z.string().describe("A highly optimized Google search query to find this person on LinkedIn"),
  });

  const { object: visionData } = await generateObject({
    model,
    schema: scanResultSchema,
    messages: [
      {
        role: 'system',
        content: 'You are an elite OSINT investigator. Analyze the provided image. If it contains a person, extract any identifying text (name badges, logos, event banners). Describe their professional context. Return a highly optimized search query to find them on LinkedIn.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this photo for OSINT purposes.' },
          { type: 'image', image: dataUri }
        ]
      }
    ]
  });

  logger.info({ visionData }, `[OSINT] Vision analysis complete`);

  // 2. Perform Web Search using the AI-generated query
  const searchResults = await searchWeb(visionData.searchQuery, 3);
  
  // Try an alternative search specifically targeting LinkedIn
  const linkedinSearchQuery = `${visionData.searchQuery} site:linkedin.com/in/`;
  const linkedinResults = await searchWeb(linkedinSearchQuery, 2);

  // Combine and deduplicate URLs
  const allResults = [...searchResults, ...linkedinResults];
  const uniqueUrls = new Set();
  const finalSuspects = [];
  
  for (const r of allResults) {
    if (!uniqueUrls.has(r.url)) {
      uniqueUrls.add(r.url);
      finalSuspects.push(r);
    }
  }

  res.json({
    success: true,
    data: {
      analysis: visionData,
      suspects: finalSuspects
    }
  });
});

export const handleEnrichProfile = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { profileUrl } = req.body;

  if (!profileUrl) {
    throw new AppError(400, 'profileUrl is required');
  }

  logger.info(`[OSINT] Starting profile enrichment for URL ${profileUrl} (User ${requestUser.id})`);

  const enrichedData = await extractLinkedInProfile(profileUrl);
  
  // Memorize the CV
  const memoryContent = `CV for ${enrichedData.name} at ${profileUrl}: Headline: ${enrichedData.headline}. Experiences: ${JSON.stringify(enrichedData.experiences)}. Education: ${JSON.stringify(enrichedData.education)}`;
  await memoryService.memorize(profileUrl, memoryContent, { type: 'osint_cv' });

  res.json({
    success: true,
    data: enrichedData
  });
});

export const handleDeepDossier = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { name, company } = req.body;

  if (!name || !company) {
    throw new AppError(400, 'name and company are required');
  }

  logger.info(`[OSINT] Generating Deep Dossier for ${name} at ${company} (User ${requestUser.id})`);

  const dossierMarkdown = await generateDeepDossier(name, company);
  
  // Create a unique ID for this target if not a URL
  const targetId = `${name.toLowerCase().replace(/\s+/g, '_')}_${company.toLowerCase().replace(/\s+/g, '_')}`;
  
  // Memorize the Deep Dossier
  await memoryService.memorize(targetId, dossierMarkdown, { type: 'osint_dossier' });

  res.json({
    success: true,
    data: dossierMarkdown
  });
});

export const handleGenerateIcebreaker = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { targetId, goal } = req.body;

  if (!targetId) {
    throw new AppError(400, 'targetId is required');
  }

  logger.info(`[OSINT] Generating Empathic Icebreaker for target ${targetId} (User ${requestUser.id})`);

  const analysis = await generateEmpathicIcebreaker(targetId, goal);

  res.json({
    success: true,
    data: analysis
  });
});

export const handleFindContact = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { name, company } = req.body;

  if (!name || !company) {
    throw new AppError(400, 'name and company are required');
  }

  logger.info(`[OSINT] Finding contact (Waterfall) for target ${name} at ${company} (User ${requestUser.id})`);

  const contactData = await findContact(name, company);

  res.json({
    success: true,
    data: contactData
  });
});

export const handleAddFromOSINT = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { campaignId, name, headline, profileUrl, icebreaker } = req.body;

  if (!campaignId || !name || !icebreaker) {
    throw new AppError(400, 'campaignId, name, and icebreaker are required');
  }

  const db = getDrizzle();

  // Verify campaign belongs to user
  const [campaign] = await db
    .select()
    .from(outreachCampaigns)
    .where(and(eq(outreachCampaigns.id, campaignId), eq(outreachCampaigns.userId, requestUser.id)));

  if (!campaign) {
    throw new AppError(404, 'Campaign not found');
  }

  const prospectId = crypto.randomUUID();
  
  // Create threadContext with the generated icebreaker to simulate what the agent would do
  const threadContext = [
    { role: 'assistant', content: icebreaker, timestamp: new Date().toISOString() }
  ];

  await db.insert(outreachProspects).values({
    id: prospectId,
    campaignId: campaignId,
    profileName: name,
    profileBio: headline || 'Imported from OSINT',
    profileUrl: profileUrl,
    status: 'contacted', // Set to contacted so the worker knows we already generated the message
    generatedMessage: icebreaker,
    threadContext: JSON.stringify(threadContext),
    currentStepNumber: 1,
    sentAt: new Date().toISOString(), // Simulating it was sent or ready to be sent
  });

  logger.info(`[OSINT] Added prospect ${name} to campaign ${campaignId} with generated Icebreaker`);

  res.status(201).json({ success: true, message: 'Prospect added to campaign' });
});
