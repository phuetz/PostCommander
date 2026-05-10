import { generateText } from 'ai';
import { eq, desc, and } from 'drizzle-orm';
import { getDrizzle } from '../../db/connection.js';
import { posts } from '../../db/schema.js';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';
export interface SimulateRequest {
  content: string;
  platform: string;
  audience?: string;
  provider: LLMProviderId;
  model: string;
}

export interface PerformanceRange {
  low: number;
  high: number;
}

export interface SimulateResult {
  impressions: PerformanceRange;
  likes: PerformanceRange;
  comments: PerformanceRange;
  shares: PerformanceRange;
  engagementRate: PerformanceRange;
  recommendations: string[];
  summary: string;
}

function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Simulate post performance using LLM analysis.
 */
export async function simulatePerformance(
  request: SimulateRequest,
  userId?: string,
): Promise<SimulateResult> {
  const model = createModel(request.provider, request.model, userId);
  const audience = request.audience || 'general professional audience (1K-10K followers)';

  let historyContext = '';
  if (userId) {
    const db = getDrizzle();
    const recentPosts = await db
      .select({ content: posts.content, platform: posts.platforms })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.status, 'published')))
      .orderBy(desc(posts.publishedAt))
      .limit(5);

    if (recentPosts.length > 0) {
      historyContext = `\n\n## User's Historical Posts Context:\nThe user has previously published the following posts. Use their style, typical length, and typical format as a baseline for your simulation:\n`;
      recentPosts.forEach((p: any, idx: number) => {
        historyContext += `\n[Post ${idx + 1} - Platform: ${p.platform}]\n${p.content}\n`;
      });
    }
  }

  const system = `You are a social media analytics expert. Your job is to predict how a post would perform on a given platform, providing realistic estimated ranges for key metrics.

## Platform: ${request.platform}
## Target Audience: ${audience}${historyContext}

## Instructions:
Analyze the post content and predict its performance. Base your predictions on:
- Content quality and hook strength
- Platform-specific engagement patterns
- Post length and formatting
- Emotional resonance and shareability
- Call-to-action effectiveness

## Metric Guidelines (for a creator with ~5K followers):
- LinkedIn: Impressions 500-50K, Likes 5-500, Comments 2-100, Shares 1-50
- Twitter/X: Impressions 200-100K, Likes 5-1000, Comments 1-50, Shares (retweets) 1-200
- Instagram: Impressions 300-30K, Likes 50-5000, Comments 5-200, Shares (saves) 5-500
- Facebook: Impressions 200-20K, Likes 10-500, Comments 5-100, Shares 1-100
- TikTok: Impressions 500-500K, Likes 10-10000, Comments 5-500, Shares 1-1000
- Pinterest: Impressions 100-50K, Likes (saves) 5-500, Comments 1-20, Shares (repins) 5-200

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "impressions": { "low": 500, "high": 5000 },
  "likes": { "low": 20, "high": 150 },
  "comments": { "low": 5, "high": 30 },
  "shares": { "low": 3, "high": 20 },
  "engagementRate": { "low": 2.5, "high": 6.0 },
  "recommendations": [
    "Specific recommendation to improve performance",
    "Another actionable suggestion"
  ],
  "summary": "One-sentence summary of expected performance"
}

Rules:
- Provide realistic ranges (low = conservative, high = optimistic)
- Engagement rate is a percentage
- Provide 3-5 specific, actionable recommendations
- The summary should be concise and insightful
- Return ONLY valid JSON. No markdown, no extra text.`;

  const user = `Predict the performance of this ${request.platform} post:\n\n${request.content}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.4,
    maxTokens: 1024,
  });

  const parsed = parseJsonResponse(result.text);

  return {
    impressions: parseRange(parsed.impressions),
    likes: parseRange(parsed.likes),
    comments: parseRange(parsed.comments),
    shares: parseRange(parsed.shares),
    engagementRate: parseRange(parsed.engagementRate, true),
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    summary: parsed.summary || 'Performance analysis complete.',
  };
}

function parseRange(value: any, isDecimal = false): PerformanceRange {
  if (!value || typeof value !== 'object') {
    return { low: 0, high: 0 };
  }
  const low = typeof value.low === 'number' ? value.low : 0;
  const high = typeof value.high === 'number' ? value.high : 0;
  if (isDecimal) {
    return { low: Math.round(low * 10) / 10, high: Math.round(high * 10) / 10 };
  }
  return { low: Math.round(low), high: Math.round(high) };
}
