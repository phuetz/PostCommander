import type { ApiResponse, SocialComment } from '@postcommander/shared';
import { api } from './_client.js';

export interface AnalyticsOverview {
  totalPosts: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  byTone: Record<string, number>;
  postsPerWeek: Array<{ week: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

export interface BestTimesResult {
  suggestions: Array<{
    dayOfWeek: string;
    hour: number;
    postCount: number;
    label: string;
  }>;
  basedOnHistory: boolean;
  message: string;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const { data } = await api.get<ApiResponse<AnalyticsOverview>>('/analytics/overview');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load analytics');
  return data.data;
}

export async function getBestTimes(): Promise<BestTimesResult> {
  const { data } = await api.get<ApiResponse<BestTimesResult>>('/analytics/best-times');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load best times');
  return data.data;
}

export async function getSocialComments(): Promise<SocialComment[]> {
  const { data } = await api.get<ApiResponse<SocialComment[]>>('/analytics/comments');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get social comments');
  return data.data;
}

export async function generateCommentReply(
  id: string,
  config: { providerId: string; modelId: string },
): Promise<string> {
  const { data } = await api.post<ApiResponse<{ reply: string }>>(
    `/analytics/comments/${id}/reply`,
    config,
  );
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to generate reply');
  return data.data.reply;
}

export async function scoreComment(
  id: string,
  config: { providerId: string; modelId: string },
): Promise<{ leadScore: number; leadStatus: string; leadReason: string }> {
  const { data } = await api.post<
    ApiResponse<{ leadScore: number; leadStatus: string; leadReason: string }>
  >(`/analytics/comments/${id}/score`, config);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to score comment');
  return data.data;
}

export async function runAgentStep(
  id: string,
  config: { providerId: string; modelId: string; userMessage?: string },
): Promise<{ history: any[]; requiresHuman: number }> {
  const { data } = await api.post<ApiResponse<{ history: any[]; requiresHuman: number }>>(
    `/analytics/comments/${id}/agent-step`,
    config,
  );
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to run agent step');
  return data.data;
}
