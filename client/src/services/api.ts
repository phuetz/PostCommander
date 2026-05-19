// NOTE: the axios `api` instance + 401 interceptor live in `./api/_client.ts`.
// Domain modules under `./api/*.ts` own their slice of the surface and are
// re-exported here so existing `import { api, getPosts, ... } from '@/services/api'`
// calls keep resolving. New code should import directly from the domain module
// (e.g. `from '@/services/api/posts'`) to make the slice explicit.
export { api } from './api/_client.js';
export * from './api/posts.js';
export * from './api/stripe.js';
export * from './api/platforms.js';
export * from './api/viral.js';
export * from './api/settings.js';
export * from './api/analytics.js';
export * from './api/images.js';

import type {
  GenerateRequest,
  GenerateResponse,
  ApiResponse,
  PaginatedResponse,
} from '@postcommander/shared';
import { api } from './api/_client.js';

// --- Generation ---

export async function generatePost(request: GenerateRequest): Promise<GenerateResponse> {
  const { data } = await api.post<ApiResponse<GenerateResponse>>('/generate', request);
  if (!data.success || !data.data) throw new Error(data.error || 'Generation failed');
  return data.data;
}

export function streamPost(
  request: GenerateRequest,
  onToken: (token: string) => void,
  onDone: (result: GenerateResponse) => void,
  onError: (error: string) => void,
  onStatus?: (status: string) => void,
): () => void {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  const url = `${baseURL}/generate/stream`;

  const controller = new AbortController();

  fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        onError(errBody?.error || `HTTP ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const rawEvents = buffer.split('\n\n');
        buffer = rawEvents.pop() || '';

        for (const rawEvent of rawEvents) {
          const lines = rawEvent.split('\n');
          let eventType = 'message';
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length === 0) {
            continue;
          }

          try {
            const parsed = JSON.parse(dataLines.join('\n'));

            if (eventType === 'text-delta') {
              onToken(parsed.content);
            } else if (eventType === 'agent-status') {
              onStatus?.(parsed.content);
            } else if (eventType === 'done') {
              onDone(parsed.result);
            } else if (eventType === 'error') {
              onError(parsed.error || parsed.message || 'Stream failed');
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Stream failed');
      }
    });

  return () => controller.abort();
}

// --- Posts CRUD ---

// (Posts CRUD — getPosts/getPost/createPost/updatePost/deletePost/publishPost/
//  schedulePost/PostComment + comment/status/approve/reject helpers — moved to
//  ./api/posts.ts. They're re-exported via `export * from './api/posts.js'`
//  at the top of this file, so existing imports of `@/services/api` keep
//  resolving them.)

// --- Hook Generator ---

export interface GenerateHooksParams {
  topic: string;
  platform: string;
  tone: string;
  count: number;
  provider: string;
  model: string;
}

export interface GeneratedHook {
  text: string;
  score: number;
  traits: string[];
}

export async function generateHooks(params: GenerateHooksParams): Promise<GeneratedHook[]> {
  const { data } = await api.post<ApiResponse<GeneratedHook[]>>('/generate/hooks', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Hook generation failed');
  return data.data;
}

// --- Carousel / Thread Generator ---

export interface GenerateCarouselParams {
  topic: string;
  platform: string;
  tone: string;
  slideCount: number;
  provider: string;
  model: string;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  body: string;
}

export interface CarouselResult {
  caption: string;
  slides: CarouselSlide[];
  hashtags: string[];
}

export async function generateCarousel(params: GenerateCarouselParams): Promise<CarouselResult> {
  const { data } = await api.post<ApiResponse<CarouselResult>>('/generate/carousel', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Carousel generation failed');
  return data.data;
}

// --- Video Script Generator ---

export interface GenerateVideoScriptParams {
  topic: string;
  duration: 'short' | 'medium' | 'long';
  platform: 'tiktok' | 'reels' | 'shorts';
  tone: string;
  provider: string;
  model: string;
}

export interface VideoScriptPart {
  duration: string;
  visual: string;
  audio: string;
  script: string;
}

export interface VideoScriptResult {
  title: string;
  hook: string;
  parts: VideoScriptPart[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export async function generateVideoScript(
  params: GenerateVideoScriptParams,
): Promise<VideoScriptResult> {
  const { data } = await api.post<ApiResponse<VideoScriptResult>>('/generate/video-script', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Video script generation failed');
  return data.data;
}

// --- Blog Article Generator ---

export interface GenerateBlogArticleParams {
  topic: string;
  articleType: string;
  provider: string;
  model: string;
  language?: string;
  authorName?: string;
  authorRole?: string;
  authorContext?: string;
  authorReferences?: string[];
  catalogMatched?: string[];
  similarSources?: Array<{ source: string; url: string }>;
}

export async function generateBlogArticle(
  params: GenerateBlogArticleParams,
): Promise<{ content: string }> {
  const { data } = await api.post<ApiResponse<{ content: string }>>(
    '/generate/blog-article',
    params,
  );
  if (!data.success || !data.data) throw new Error(data.error || 'Blog article generation failed');
  return data.data;
}

// --- Templates ---

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: string;
  content: string;
  variables: string[];
  example: string;
}

export interface TemplateFilters {
  category?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
}

export async function getTemplates(
  filters?: TemplateFilters,
): Promise<PaginatedResponse<Template>> {
  const { data } = await api.get<PaginatedResponse<Template>>('/templates', {
    params: filters,
  });
  return data;
}

export async function getTemplate(id: string): Promise<Template> {
  const { data } = await api.get<ApiResponse<Template>>(`/templates/${id}`);
  if (!data.success || !data.data) throw new Error(data.error || 'Template not found');
  return data.data;
}

export async function useTemplate(
  id: string,
  variables: Record<string, string>,
  provider?: string,
  model?: string,
): Promise<{ content: string; hashtags: string[] }> {
  const { data } = await api.post<ApiResponse<{ content: string; hashtags: string[] }>>(
    `/templates/${id}/generate`,
    { variables, provider, model },
  );
  if (!data.success || !data.data) throw new Error(data.error || 'Template generation failed');
  return data.data;
}

// --- Content Repurposer ---

export interface RepurposeParams {
  content: string;
  sourcePlatform: string;
  targetPlatforms: string[];
  tone: string;
  provider: string;
  model: string;
}

export interface RepurposedContent {
  platform: string;
  content: string;
  charCount: number;
  hashtags: string[];
}

export async function repurposePost(params: RepurposeParams): Promise<RepurposedContent[]> {
  const { data } = await api.post<ApiResponse<RepurposedContent[]>>('/generate/repurpose', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Repurpose failed');
  return data.data;
}

// --- Hashtag Research ---

export interface HashtagResearchParams {
  topic: string;
  platform: string;
  count: number;
}

export interface HashtagResult {
  tag: string;
  category: 'trending' | 'popular' | 'niche';
  relevanceScore: number;
}

export async function researchHashtags(params: HashtagResearchParams): Promise<HashtagResult[]> {
  const { data } = await api.post<ApiResponse<HashtagResult[]>>('/generate/hashtags', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Hashtag research failed');
  return data.data;
}

// --- Writing Styles ---

export interface WritingStyle {
  id: string;
  name: string;
  description: string;
  traits: {
    vocabularyLevel: string;
    sentenceLength: string;
    emojiUsage: string;
    formality: string;
    tone: string;
  };
  samplePosts: string[];
  createdAt: string;
}

export interface CreateStyleData {
  name: string;
  description: string;
  samplePosts: string[];
}

export async function getStyles(): Promise<WritingStyle[]> {
  const { data } = await api.get<ApiResponse<WritingStyle[]>>('/styles');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load styles');
  return data.data;
}

export async function getStyle(id: string): Promise<WritingStyle> {
  const { data } = await api.get<ApiResponse<WritingStyle>>(`/styles/${id}`);
  if (!data.success || !data.data) throw new Error(data.error || 'Style not found');
  return data.data;
}

export async function createStyle(styleData: CreateStyleData): Promise<WritingStyle> {
  const { data } = await api.post<ApiResponse<WritingStyle>>('/styles', styleData);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create style');
  return data.data;
}

export async function deleteStyle(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/styles/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete style');
}

export interface GenerateWithStyleParams {
  styleId: string;
  prompt: string;
  platform: string;
  provider: string;
  model: string;
}

export async function generateWithStyle(
  id: string,
  params: GenerateWithStyleParams,
): Promise<string> {
  const { data } = await api.post<ApiResponse<string>>(`/styles/${id}/generate`, params);
  if (!data.success || !data.data) throw new Error(data.error || 'Style generation failed');
  return data.data;
}

// --- A/B Testing ---

export interface ABVariant {
  id: string;
  content: string;
  angle: string;
  hookStyle: string;
}

export interface ABTestResult {
  variants: ABVariant[];
}

export interface ABTestParams {
  prompt: string;
  platform: string;
  tone: string;
  provider: string;
  model: string;
  variantCount: number;
}

export async function generateABTest(params: ABTestParams): Promise<ABTestResult> {
  const { data } = await api.post<ApiResponse<ABTestResult>>('/generate/ab-test', params);
  if (!data.success || !data.data) throw new Error(data.error || 'A/B test generation failed');
  return data.data;
}

// --- Engagement Analysis ---

export interface EngagementBreakdown {
  hookStrength: number;
  readability: number;
  emotionalAppeal: number;
  callToAction: number;
  hashtagRelevance: number;
  lengthOptimization: number;
}

export interface EngagementResult {
  overallScore: number;
  breakdown: EngagementBreakdown;
  suggestions: string[];
}

export interface EngagementParams {
  content: string;
  platform: string;
  provider: string;
  model: string;
}

export async function analyzeEngagement(params: EngagementParams): Promise<EngagementResult> {
  const { data } = await api.post<ApiResponse<EngagementResult>>('/analyze/engagement', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Engagement analysis failed');
  return data.data;
}

// --- Performance Simulator ---

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

export interface SimulateParams {
  content: string;
  platform: string;
  audience?: string;
  provider: string;
  model: string;
}

export async function simulatePerformance(params: SimulateParams): Promise<SimulateResult> {
  const { data } = await api.post<ApiResponse<SimulateResult>>('/analyze/simulate', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Performance simulation failed');
  return data.data;
}

// --- Trending Topics ---

export interface TrendingTopic {
  title: string;
  description: string;
  trendScore: number;
  suggestedAngles: string[];
}

export interface TrendingResult {
  topics: TrendingTopic[];
}

// --- Inbox ---

export interface InboxComment {
  id: string;
  platformCommentId: string;
  authorName: string;
  authorHandle: string | null;
  authorAvatarUrl: string | null;
  content: string;
  isReplied: number;
  replyContent: string | null;
  leadScore: number;
  leadStatus: string | null;
  leadReason: string | null;
  requiresHuman: number;
  isResolved: number;
  agentState: string | null;
  createdAt: string;
  platform: string;
  postContent: string | null;
}

export async function getInbox(): Promise<InboxComment[]> {
  const { data } = await api.get<ApiResponse<InboxComment[]>>('/inbox');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch inbox');
  return data.data;
}

export async function resolveConversation(id: string): Promise<void> {
  const { data } = await api.patch<ApiResponse>(`/inbox/${id}/resolve`);
  if (!data.success) throw new Error(data.error || 'Failed to resolve conversation');
}

export async function replyToComment(id: string, content: string): Promise<void> {
  const { data } = await api.post<ApiResponse>(`/inbox/${id}/reply`, { content });
  if (!data.success) throw new Error(data.error || 'Failed to reply');
}

export interface TrendingParams {
  platform: string;
  industry: string;
  language: string;
  provider: string;
  model: string;
}

export async function getTrendingTopics(params: TrendingParams): Promise<TrendingResult> {
  const { data } = await api.post<ApiResponse<TrendingResult>>('/trending', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Trending topics failed');
  return data.data;
}

// --- Content Pillars ---

export interface ContentPillar {
  id: string;
  name: string;
  description: string | null;
  color: string;
  topics: string[];
  postingFrequency: string;
  targetPlatforms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PillarWithCount extends ContentPillar {
  ideaCount: number;
  ideaCountByStatus: Record<string, number>;
}

export interface ContentIdea {
  id: string;
  pillarId: string;
  title: string;
  description: string | null;
  status: 'idea' | 'drafted' | 'scheduled' | 'published';
  postId: string | null;
  priority: number;
  createdAt: string;
}

export interface CreatePillarParams {
  name: string;
  description?: string;
  color?: string;
  topics?: string[];
  postingFrequency?: string;
  targetPlatforms?: string[];
}

export interface UpdatePillarParams {
  name?: string;
  description?: string;
  color?: string;
  topics?: string[];
  postingFrequency?: string;
  targetPlatforms?: string[];
}

export interface CreateIdeaParams {
  title: string;
  description?: string;
  status?: string;
  priority?: number;
}

export interface UpdateIdeaParams {
  title?: string;
  description?: string;
  status?: string;
  priority?: number;
  postId?: string | null;
}

export interface GenerateIdeasParams {
  provider: string;
  model: string;
  count?: number;
}

export interface StrategyOverview {
  pillars: PillarWithCount[];
  totalIdeas: number;
  ideasByStatus: Record<string, number>;
}

export async function getPillars(): Promise<PillarWithCount[]> {
  const { data } = await api.get<ApiResponse<PillarWithCount[]>>('/pillars');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load pillars');
  return data.data;
}

export async function createPillarApi(params: CreatePillarParams): Promise<ContentPillar> {
  const { data } = await api.post<ApiResponse<ContentPillar>>('/pillars', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create pillar');
  return data.data;
}

export async function updatePillarApi(
  id: string,
  params: UpdatePillarParams,
): Promise<ContentPillar> {
  const { data } = await api.put<ApiResponse<ContentPillar>>(`/pillars/${id}`, params);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update pillar');
  return data.data;
}

export async function deletePillarApi(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/pillars/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete pillar');
}

export async function getPillarIdeas(pillarId: string): Promise<ContentIdea[]> {
  const { data } = await api.get<ApiResponse<ContentIdea[]>>(`/pillars/${pillarId}/ideas`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load ideas');
  return data.data;
}

export async function createIdeaApi(
  pillarId: string,
  params: CreateIdeaParams,
): Promise<ContentIdea> {
  const { data } = await api.post<ApiResponse<ContentIdea>>(`/pillars/${pillarId}/ideas`, params);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create idea');
  return data.data;
}

export async function generateIdeasApi(
  pillarId: string,
  params: GenerateIdeasParams,
): Promise<ContentIdea[]> {
  const { data } = await api.post<ApiResponse<ContentIdea[]>>(
    `/pillars/${pillarId}/generate-ideas`,
    params,
  );
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to generate ideas');
  return data.data;
}

export async function updateIdeaApi(
  ideaId: string,
  params: UpdateIdeaParams,
): Promise<ContentIdea> {
  const { data } = await api.put<ApiResponse<ContentIdea>>(`/pillars/ideas/${ideaId}`, params);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update idea');
  return data.data;
}

export async function deleteIdeaApi(ideaId: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/pillars/ideas/${ideaId}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete idea');
}

export async function getStrategyOverview(): Promise<StrategyOverview> {
  const { data } = await api.get<ApiResponse<StrategyOverview>>('/pillars/strategy');
  if (!data.success || !data.data)
    throw new Error(data.error || 'Failed to load strategy overview');
  return data.data;
}


export default api;
