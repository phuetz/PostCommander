import type { Request, Response } from 'express';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import { socialComments, postPublications, posts, outreachProspects, outreachReplies, outreachCampaigns } from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import { Resend } from 'resend';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const getInbox = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();

  // Fetch unresolved comments for posts owned by the user
  const comments = await db
    .select({
      id: socialComments.id,
      platformCommentId: socialComments.platformCommentId,
      authorName: socialComments.authorName,
      authorHandle: socialComments.authorHandle,
      authorAvatarUrl: socialComments.authorAvatarUrl,
      content: socialComments.content,
      isReplied: socialComments.isReplied,
      replyContent: socialComments.replyContent,
      leadScore: socialComments.leadScore,
      leadStatus: socialComments.leadStatus,
      leadReason: socialComments.leadReason,
      requiresHuman: socialComments.requiresHuman,
      isResolved: socialComments.isResolved,
      agentState: socialComments.agentState,
      createdAt: socialComments.createdAt,
      platform: postPublications.platform,
      postContent: posts.content,
    })
    .from(socialComments)
    .innerJoin(postPublications, eq(socialComments.postPublicationId, postPublications.id))
    .innerJoin(posts, eq(postPublications.postId, posts.id))
    .where(and(eq(posts.userId, requestUser.id), eq(socialComments.isResolved, false)));

  // Fetch unresolved outreach replies for campaigns owned by the user
  const outreachRaw = await db
    .select({
      id: outreachProspects.id, // Using prospect ID as the conversation ID to easily resolve/reply
      platformCommentId: outreachReplies.id,
      authorName: outreachProspects.profileName,
      authorHandle: outreachProspects.profileUrl,
      content: outreachReplies.content,
      replyStatus: outreachProspects.replyStatus,
      threadContext: outreachProspects.threadContext,
      createdAt: outreachReplies.receivedAt,
      platform: outreachCampaigns.platform,
      postContent: outreachCampaigns.campaignGoal,
    })
    .from(outreachReplies)
    .innerJoin(outreachProspects, eq(outreachReplies.prospectId, outreachProspects.id))
    .innerJoin(outreachCampaigns, eq(outreachProspects.campaignId, outreachCampaigns.id))
    .where(
      and(
        eq(outreachCampaigns.userId, requestUser.id),
        // We consider 'replied' or 'requires_human' status as active in inbox, assuming they aren't resolved
        inArray(outreachProspects.status, ['replied', 'requires_human'])
      )
    );

  const mappedOutreach = outreachRaw.map(r => ({
    id: r.id,
    platformCommentId: r.platformCommentId,
    authorName: r.authorName,
    authorHandle: r.authorHandle,
    authorAvatarUrl: null,
    content: r.content,
    isReplied: false,
    replyContent: null,
    leadScore: r.replyStatus === 'positive' ? 95 : r.replyStatus === 'negative' ? 15 : 50,
    leadStatus: r.replyStatus === 'positive' ? 'hot' : r.replyStatus === 'negative' ? 'cold' : 'warm',
    leadReason: 'Réponse à la campagne de prospection',
    requiresHuman: true,
    isResolved: false,
    agentState: r.threadContext,
    createdAt: r.createdAt,
    platform: r.platform || 'email',
    postContent: `Objectif de campagne: ${r.postContent}`,
  }));

  const combined = [...comments, ...mappedOutreach].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ success: true, data: combined });
});

export const resolveConversation = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;

  // Attempt to resolve social comment
  await db
    .update(socialComments)
    .set({ isResolved: true })
    .where(eq(socialComments.id, id));

  // Attempt to resolve outreach prospect (change status from 'replied' to 'resolved')
  await db
    .update(outreachProspects)
    .set({ status: 'resolved' })
    .where(eq(outreachProspects.id, id));

  res.json({ success: true });
});

export const replyToComment = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { content } = req.body;

  if (!content) {
    throw new AppError(400, 'Reply content is required');
  }

  // Update comment record to show it was replied and resolved
  await db
    .update(socialComments)
    .set({
      isReplied: true,
      replyContent: content,
      isResolved: true,
    })
    .where(eq(socialComments.id, id));

  // Also check if it's an outreach prospect
  const prospect = await db
    .select()
    .from(outreachProspects)
    .where(eq(outreachProspects.id, id))
    .limit(1)
    .then(rows => rows[0]);

  if (prospect) {
    let thread: Array<{ role: string; content: string }> = [];
    try {
      if (prospect.threadContext) {
        thread = JSON.parse(prospect.threadContext);
      }
    } catch {
      // Ignore JSON parse errors
    }
    thread.push({ role: 'assistant', content });

    await db
      .update(outreachProspects)
      .set({
        status: 'resolved',
        threadContext: JSON.stringify(thread)
      })
      .where(eq(outreachProspects.id, id));

    // Send real email via Resend if configured and prospect looks like an email
    if (config.RESEND_API_KEY && config.RESEND_FROM) {
      // Very basic email extraction (if name/bio is an email, or if profileUrl is an email)
      const targetEmail = prospect.profileName.includes('@') ? prospect.profileName : prospect.profileUrl?.includes('@') ? prospect.profileUrl : null;
      
      if (targetEmail) {
        try {
          const resend = new Resend(config.RESEND_API_KEY);
          await resend.emails.send({
            from: config.RESEND_FROM,
            to: targetEmail,
            subject: `Re: Our recent conversation`,
            text: content,
          });
          logger.info(`[Inbox] Sent reply email to ${targetEmail}`);
        } catch (error) {
          logger.error({ error }, `[Inbox] Failed to send email to ${targetEmail}`);
        }
      }
    }
  }

  // In a full implementation, you would trigger a background job to post the reply to the native platform.
  
  res.json({ success: true });
});
