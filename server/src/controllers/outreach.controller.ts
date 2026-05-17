import type { Request, Response } from 'express';
import { getDrizzle } from '../db/connection.js';
import { outreachCampaigns, outreachProspects, outreachSequenceSteps, outreachReplies } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { catchAsync } from '../utils/catch-async.js';
import { AppError } from '../middleware/error-handler.js';
import { requireRequestUser } from '../utils/request-user.js';
import crypto from 'crypto';
import { CreateOutreachCampaignSchema, UpdateOutreachCampaignSchema } from '@postcommander/shared';
import { MemoryClient } from 'mem0ai';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

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

  // Add memory to Mem0 if API key is configured
  if (config.MEM0_API_KEY) {
    try {
      const mem0 = new MemoryClient({ apiKey: config.MEM0_API_KEY });
      const memoryContent = `Prospect ${prospect.profileName} replied with: "${content || 'Simulated positive reply'}". Context: we reached out for ${prospect.campaignId}.`;
      await mem0.add([{ role: 'user', content: memoryContent }], { user_id: prospect.id });
      logger.info(`[Mem0] Successfully added memory for prospect ${prospect.profileName}`);
    } catch (err) {
      logger.error({ err }, '[Mem0] Failed to add memory for prospect');
    }
  }

  res.json({ success: true, message: 'Simulated reply processed successfully' });
});
