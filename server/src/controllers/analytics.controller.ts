import type { Request, Response } from 'express';
import { eq, sql, and, isNotNull, ne } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import { posts as postsTable, postPublications, socialComments } from '../db/schema.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';

interface OverviewStats {
  totalPosts: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  byTone: Record<string, number>;
  postsPerWeek: Array<{ week: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

interface BestTimesSuggestion {
  dayOfWeek: string;
  hour: number;
  postCount: number;
  label: string;
}

/**
 * GET /api/analytics/overview
 */
export const getOverview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();

  // Total posts
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postsTable)
    .where(eq(postsTable.userId, requestUser.id));
  const totalPosts = Number(totalResult?.count ?? 0);

  // By status
  const statusRows = await db
    .select({ status: postsTable.status, count: sql<number>`count(*)` })
    .from(postsTable)
    .where(eq(postsTable.userId, requestUser.id))
    .groupBy(postsTable.status);

  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.status] = Number(row.count);
  }

  // By platform (posts store platforms as JSON array)
  const allPlatforms = await db
    .select({ platforms: postsTable.platforms })
    .from(postsTable)
    .where(eq(postsTable.userId, requestUser.id));
  const byPlatform: Record<string, number> = {};
  for (const post of allPlatforms) {
    try {
      const platforms: string[] = JSON.parse(post.platforms);
      for (const p of platforms) {
        byPlatform[p] = (byPlatform[p] ?? 0) + 1;
      }
    } catch {
      // skip malformed data
    }
  }

  // By tone
  const toneRows = await db
    .select({ tone: postsTable.tone, count: sql<number>`count(*)` })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.userId, requestUser.id),
        isNotNull(postsTable.tone),
        ne(postsTable.tone, ''),
      ),
    )
    .groupBy(postsTable.tone);

  const byTone: Record<string, number> = {};
  for (const row of toneRows) {
    if (row.tone) {
      byTone[row.tone] = Number(row.count);
    }
  }

  // Posts per week (last 12 weeks)
  const weekRows = await db
    .select({
      week: sql<string>`strftime('%Y-W%W', ${postsTable.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.userId, requestUser.id),
        sql`${postsTable.createdAt} >= datetime('now', '-12 weeks')`,
      ),
    )
    .groupBy(sql`week`)
    .orderBy(sql`week ASC`);

  const postsPerWeek = weekRows.map((r) => ({
    week: r.week,
    count: Number(r.count),
  }));

  // Recent activity (last 30 days)
  const activityRows = await db
    .select({
      date: sql<string>`date(${postsTable.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(postsTable)
    .where(
      and(
        eq(postsTable.userId, requestUser.id),
        sql`${postsTable.createdAt} >= datetime('now', '-30 days')`,
      ),
    )
    .groupBy(sql`date`)
    .orderBy(sql`date ASC`);

  const recentActivity = activityRows.map((r) => ({
    date: r.date,
    count: Number(r.count),
  }));

  const overview: OverviewStats = {
    totalPosts,
    byStatus,
    byPlatform,
    byTone,
    postsPerWeek,
    recentActivity,
  };

  res.json({ success: true, data: overview });
});

/**
 * GET /api/analytics/best-times
 * Suggest best posting times based on historical published posts.
 */
export const getBestTimes = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();

  // Analyze published posts by day of week and hour
  const rows = await db
    .select({
      day_of_week: sql<string>`
        CASE CAST(strftime('%w', ${postsTable.publishedAt}) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END`,
      hour: sql<number>`CAST(strftime('%H', ${postsTable.publishedAt}) AS INTEGER)`,
      count: sql<number>`count(*)`,
    })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), isNotNull(postsTable.publishedAt)))
    .groupBy(sql`day_of_week`, sql`hour`)
    .orderBy(sql`count DESC`);

  if (rows.length === 0) {
    // If no published posts, return general best practices
    const defaults: BestTimesSuggestion[] = [
      {
        dayOfWeek: 'Tuesday',
        hour: 10,
        postCount: 0,
        label: 'Tuesday 10:00 AM (industry best practice)',
      },
      {
        dayOfWeek: 'Wednesday',
        hour: 12,
        postCount: 0,
        label: 'Wednesday 12:00 PM (lunch break engagement)',
      },
      {
        dayOfWeek: 'Thursday',
        hour: 9,
        postCount: 0,
        label: 'Thursday 9:00 AM (high morning engagement)',
      },
      { dayOfWeek: 'Tuesday', hour: 14, postCount: 0, label: 'Tuesday 2:00 PM (afternoon peak)' },
      { dayOfWeek: 'Monday', hour: 8, postCount: 0, label: 'Monday 8:00 AM (start of week)' },
    ];

    res.json({
      success: true,
      data: {
        suggestions: defaults,
        basedOnHistory: false,
        message:
          'No published posts yet. These are industry best practices. Suggestions will improve as you publish more content.',
      },
    });
    return;
  }

  const suggestions: BestTimesSuggestion[] = rows.slice(0, 10).map((row) => {
    const hourFormatted =
      row.hour === 0
        ? '12:00 AM'
        : row.hour < 12
          ? `${row.hour}:00 AM`
          : row.hour === 12
            ? '12:00 PM'
            : `${row.hour - 12}:00 PM`;

    return {
      dayOfWeek: row.day_of_week,
      hour: row.hour,
      postCount: Number(row.count),
      label: `${row.day_of_week} ${hourFormatted} (${row.count} post${row.count === 1 ? '' : 's'} published)`,
    };
  });

  res.json({
    success: true,
    data: {
      suggestions,
      basedOnHistory: true,
      totalPublished: rows.reduce((sum: number, r) => sum + Number(r.count), 0),
      message:
        'Based on your publishing history. Times with higher post counts indicate your most active publishing windows.',
    },
  });
});

export const getSocialComments = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();

  const comments = await db.query.socialComments.findMany({
    orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    limit: 50,
  });

  res.json({ success: true, data: comments });
});

export const generateCommentReply = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;
  const { providerId, modelId } = req.body;
  const db = getDrizzle();

  const commentId = id as string;

  if (!providerId || !modelId) {
    return res.status(400).json({ error: 'providerId and modelId are required' });
  }

  const commentResult = await db
    .select({
      id: socialComments.id,
      content: socialComments.content,
      authorName: socialComments.authorName,
      postContent: postsTable.content,
      postTone: postsTable.tone,
    })
    .from(socialComments)
    .innerJoin(postPublications, eq(postPublications.id, socialComments.postPublicationId))
    .innerJoin(postsTable, eq(postsTable.id, postPublications.postId))
    .where(eq(socialComments.id, commentId))
    .limit(1);

  const comment = commentResult[0];

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const { generateAutoReply } = await import('../services/llm/community.js');

  const reply = await generateAutoReply({
    providerId,
    modelId,
    userId: requestUser.id,
    postContent: comment.postContent || '',
    commentContent: comment.content,
    authorName: comment.authorName,
    brandTone: comment.postTone || 'friendly',
  });

  await db
    .update(socialComments)
    .set({ isReplied: 1, replyContent: reply })
    .where(eq(socialComments.id, commentId));

  res.json({ success: true, data: { reply } });
});

export const scoreComment = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;
  const { providerId, modelId } = req.body;
  const db = getDrizzle();

  const commentId = id as string;

  if (!providerId || !modelId) {
    return res.status(400).json({ error: 'providerId and modelId are required' });
  }

  const commentResult = await db
    .select({
      id: socialComments.id,
      content: socialComments.content,
      authorName: socialComments.authorName,
      postContent: postsTable.content,
    })
    .from(socialComments)
    .innerJoin(postPublications, eq(postPublications.id, socialComments.postPublicationId))
    .innerJoin(postsTable, eq(postsTable.id, postPublications.postId))
    .where(eq(socialComments.id, commentId))
    .limit(1);

  const comment = commentResult[0];

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const { scoreLeadInteraction } = await import('../services/llm/community.js');

  const scoreData = await scoreLeadInteraction({
    providerId,
    modelId,
    userId: requestUser.id,
    postContent: comment.postContent || '',
    commentContent: comment.content,
    authorName: comment.authorName,
  });

  await db
    .update(socialComments)
    .set({
      leadScore: scoreData.leadScore,
      leadStatus: scoreData.leadStatus,
      leadReason: scoreData.leadReason,
    })
    .where(eq(socialComments.id, commentId));

  res.json({ success: true, data: scoreData });
});

export const runAgentStep = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;
  const { providerId, modelId, userMessage } = req.body;
  const db = getDrizzle();

  const commentId = id as string;

  if (!providerId || !modelId) {
    return res.status(400).json({ error: 'providerId and modelId are required' });
  }

  const commentResult = await db
    .select({
      id: socialComments.id,
      content: socialComments.content,
      authorName: socialComments.authorName,
      agentState: socialComments.agentState,
      postContent: postsTable.content,
    })
    .from(socialComments)
    .innerJoin(postPublications, eq(postPublications.id, socialComments.postPublicationId))
    .innerJoin(postsTable, eq(postsTable.id, postPublications.postId))
    .where(eq(socialComments.id, commentId))
    .limit(1);

  const comment = commentResult[0];

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // Parse existing history
  let history: any[] = [];
  if (comment.agentState) {
    try {
      history = JSON.parse(comment.agentState);
    } catch (e) {
      history = [];
    }
  } else {
    // Initial state: The prospect's first comment
    history.push({ role: 'user', content: comment.content });
  }

  // If user provided a new message (simulating the prospect replying again, or user injecting a prompt)
  if (userMessage) {
    history.push({ role: 'user', content: userMessage });
  }

  const { runConversationalAgent } = await import('../services/llm/community.js');

  const result = await runConversationalAgent({
    providerId,
    modelId,
    userId: requestUser.id,
    postContent: comment.postContent || '',
    authorName: comment.authorName,
    history,
  });

  // Extract the new response from the agent
  // the ai sdk `generateText` returns text, but also has `toolCalls` and `toolResults` if we used tools
  // Let's build the new history
  const assistantResponse = result.text;

  // Since we called maxSteps: 3, the agent might have made tool calls. We want to save the final history.
  // Actually, Vercel AI SDK result.response.messages contains the new messages.
  const newMessages = result.response?.messages || [
    { role: 'assistant', content: assistantResponse },
  ];

  history.push(...newMessages);

  // Check if escalateToHuman was called
  const toolCalls = result.toolCalls || [];
  const requiresHuman = toolCalls.some((tc) => tc.toolName === 'escalateToHuman') ? 1 : 0;

  await db
    .update(socialComments)
    .set({
      agentState: JSON.stringify(history),
      requiresHuman,
      isReplied: 1, // Mark as replied since the agent handled it
    })
    .where(eq(socialComments.id, commentId));

  res.json({ success: true, data: { history, requiresHuman } });
});
