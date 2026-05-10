import { eq } from 'drizzle-orm';
import { getDrizzle } from '../../db/connection.js';
import * as schema from '../../db/schema.js';
import { scoreLeadInteraction, runConversationalAgent } from '../llm/community.js';
import { logger } from '../../utils/logger.js';
import type { CoreMessage } from 'ai';

export async function processAgentWorkflow(commentId: string) {
  const db = getDrizzle();

  // 1. Fetch the comment and its post context
  const commentRows = await db
    .select({
      comment: schema.socialComments,
      publication: schema.postPublications,
      post: schema.posts,
    })
    .from(schema.socialComments)
    .innerJoin(schema.postPublications, eq(schema.socialComments.postPublicationId, schema.postPublications.id))
    .innerJoin(schema.posts, eq(schema.postPublications.postId, schema.posts.id))
    .where(eq(schema.socialComments.id, commentId))
    .limit(1);

  if (!commentRows.length) {
    logger.warn(`Comment ${commentId} not found for agent processing.`);
    return;
  }

  const { comment, post } = commentRows[0];

  // We need an LLM provider and model configured for this user.
  // We'll fall back to defaults or the post's original provider if available.
  const providerId = post.llmProvider || 'openai';
  const modelId = post.llmModel || 'gpt-4o'; // Assuming a decent default model

  let currentStatus = comment.leadStatus;
  let currentScore = comment.leadScore;

  // 2. QUALIFICATION PHASE
  if (currentStatus === 'unscored' || currentStatus === null) {
    logger.info(`Scoring lead for comment ${commentId}...`);
    try {
      const scoring = await scoreLeadInteraction({
        providerId: providerId as any,
        modelId,
        postContent: post.content,
        commentContent: comment.content,
        authorName: comment.authorName,
        userId: post.userId || undefined,
      });

      currentScore = scoring.leadScore;
      currentStatus = scoring.leadStatus;

      await db
        .update(schema.socialComments)
        .set({
          leadScore: scoring.leadScore,
          leadStatus: scoring.leadStatus,
          leadReason: scoring.leadReason,
        })
        .where(eq(schema.socialComments.id, commentId));
        
      logger.info(`Comment ${commentId} scored: ${scoring.leadScore} (${scoring.leadStatus})`);
    } catch (error) {
      logger.error({ error, commentId }, 'Failed to score lead interaction.');
      return;
    }
  }

  // 3. CONVERSATIONAL AGENT PHASE
  // Only proceed if it's a potential or hot lead and doesn't require a human already.
  if (
    (currentStatus === 'potential' || currentStatus === 'hot') &&
    comment.requiresHuman !== 1
  ) {
    logger.info(`Running conversational agent for comment ${commentId}...`);
    try {
      // Parse history or initialize it
      let history: CoreMessage[] = [];
      if (comment.agentState) {
        history = JSON.parse(comment.agentState);
      } else {
        // Initial user message is the comment itself
        history.push({ role: 'user', content: comment.content });
      }

      const agentResult = await runConversationalAgent({
        providerId: providerId as any,
        modelId,
        postContent: post.content,
        authorName: comment.authorName,
        history,
        userId: post.userId || undefined,
      });

      // Append the agent's response to the history
      history.push({ role: 'assistant', content: agentResult.text });

      // Check if it required human escalation
      const requiresHuman = agentResult.text.includes('[SYSTEM: Conversation escalated') ? 1 : 0;

      await db
        .update(schema.socialComments)
        .set({
          agentState: JSON.stringify(history),
          replyContent: agentResult.text,
          requiresHuman,
          isReplied: 1, // Marked as replied for now
        })
        .where(eq(schema.socialComments.id, commentId));

      logger.info(`Agent responded to comment ${commentId}. Escalated: ${requiresHuman}`);
      
      // Note: In a full system, you would now trigger the actual API call to the platform
      // (LinkedIn/Twitter) to post the 'replyContent' as a real comment.
      
    } catch (error) {
      logger.error({ error, commentId }, 'Failed to run conversational agent.');
    }
  }
}
