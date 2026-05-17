import type { Request, Response } from 'express';
import { getDrizzle } from '../db/connection.js';
import * as schema from '../db/schema.js';
import { agentQueue } from '../services/jobs/queue.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'node:crypto';

export async function simulateCommentHandler(req: Request, res: Response) {
  try {
    const { postId, content, authorName } = req.body;

    if (!postId || !content || !authorName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: postId, content, authorName',
      });
    }

    const db = getDrizzle();

    // To simulate, we need a post_publication for this post.
    // Let's just create a dummy one if it doesn't exist to attach the comment to.
    const { eq } = await import('drizzle-orm');
    const publications = await db
      .select()
      .from(schema.postPublications)
      .where(eq(schema.postPublications.postId, postId))
      .limit(1);

    let publicationId = '';
    if (publications.length > 0) {
      publicationId = publications[0].id;
    } else {
      publicationId = randomUUID();
      await db.insert(schema.postPublications).values({
        id: publicationId,
        postId,
        platform: 'linkedin', // Assume linkedin for testing
        status: 'published',
        publishedAt: new Date().toISOString(),
      });
    }

    // Create the incoming social comment
    const commentId = randomUUID();
    await db.insert(schema.socialComments).values({
      id: commentId,
      postPublicationId: publicationId,
      platformCommentId: `sim_${Date.now()}`,
      authorName,
      content,
      publishedAt: new Date().toISOString(),
    });

    logger.info(`Simulated comment ${commentId} created. Enqueueing to agent...`);

    // Enqueue the agent workflow job
    await agentQueue.add('process-comment', { commentId });

    res.status(200).json({
      success: true,
      data: {
        commentId,
        message: 'Comment simulated and agent job enqueued successfully.',
      },
    });
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to simulate comment and trigger agent.');
    res.status(500).json({
      success: false,
      error: 'Failed to simulate comment.',
    });
  }
}

export async function scrapeLeadHandler(req: Request, res: Response) {
  try {
    const { leads, sourceUrl } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or empty leads array.',
      });
    }

    const db = getDrizzle();

    // We need a dummy post publication to attach scraped leads to for the agent to work.
    // In a real scenario, we might map sourceUrl to a known competitor post entity.
    const publicationId = randomUUID();
    await db.insert(schema.postPublications).values({
      id: publicationId,
      postId: randomUUID(), // dummy post
      platform: 'linkedin',
      status: 'published',
      publishedAt: new Date().toISOString(),
    });

    const enqueuedComments = [];

    for (const lead of leads) {
      if (!lead.name || !lead.content) continue;

      const commentId = randomUUID();
      await db.insert(schema.socialComments).values({
        id: commentId,
        postPublicationId: publicationId,
        platformCommentId: `scraped_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        authorName: lead.name,
        authorHandle: lead.headline || null,
        content: lead.content,
        publishedAt: new Date().toISOString(),
      });

      // Enqueue the agent workflow job
      await agentQueue.add('process-comment', { commentId });
      enqueuedComments.push(commentId);
    }

    logger.info(
      `Successfully scraped and enqueued ${enqueuedComments.length} leads from ${sourceUrl}.`,
    );

    res.status(200).json({
      success: true,
      data: {
        enqueued: enqueuedComments.length,
        message: 'Leads scraped and agent jobs enqueued successfully.',
      },
    });
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to process scraped leads.');
    res.status(500).json({
      success: false,
      error: 'Failed to process scraped leads.',
    });
  }
}

export async function ghostwriteCommentHandler(req: Request, res: Response) {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Missing context.',
      });
    }

    // Call the LLM to generate a comment based on the context
    // MVP: For now we just return a simulated smart response
    const aiResponse = `Thanks for sharing this! I completely agree with your point about ${context.substring(0, 15)}...`;

    res.status(200).json({
      success: true,
      data: {
        text: aiResponse,
      },
    });
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to ghostwrite comment.');
    res.status(500).json({
      success: false,
      error: 'Failed to ghostwrite comment.',
    });
  }
}

export async function shadowProfileHandler(req: Request, res: Response) {
  try {
    const { profileUrl, name, headline, about } = req.body;

    if (!profileUrl || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing profileUrl or name.',
      });
    }

    logger.info(`Shadow Profiling: Received data for ${name} (${profileUrl})`);

    // MVP: In a real app, you would upsert this into a CRM table
    // For now, we just log it as a successful shadow profile capture.

    res.status(200).json({
      success: true,
      message: 'Profile captured silently.',
    });
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to capture shadow profile.');
    res.status(500).json({
      success: false,
      error: 'Failed to capture shadow profile.',
    });
  }
}

export async function emergencyStopHandler(req: Request, res: Response) {
  try {
    const { reason, sourceUrl } = req.body;
    logger.warn(`[EMERGENCY STOP] Triggered by extension. Reason: ${reason}, URL: ${sourceUrl}`);

    const db = getDrizzle();

    // Pause all active outreach campaigns to protect the account
    const { eq } = await import('drizzle-orm');
    await db
      .update(schema.outreachCampaigns)
      .set({ status: 'paused', updatedAt: new Date().toISOString() })
      .where(eq(schema.outreachCampaigns.status, 'active'));

    // In a real app, we would also emit a WebSocket event to the frontend here 
    // to show an emergency banner.

    res.status(200).json({
      success: true,
      message: 'Emergency stop executed. All active campaigns paused.',
    });
  } catch (error: unknown) {
    logger.error({ error }, 'Failed to execute emergency stop.');
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop.',
    });
  }
}
