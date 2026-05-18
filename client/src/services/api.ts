import axios from 'axios';
import type {
  Post,
  GenerateRequest,
  GenerateResponse,
  PublishResult,
  ApiResponse,
  PaginatedResponse,
  PlatformConnection,
  Settings,
  DeletedAccountAudit,
  ExportedAccountData,
  SocialComment,
} from '@postcommander/shared';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export async function getPosts(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  platform?: string;
  search?: string;
}): Promise<PaginatedResponse<Post>> {
  const { data } = await api.get<PaginatedResponse<Post>>('/posts', { params });
  return data;
}

export async function getPost(id: string): Promise<Post> {
  const { data } = await api.get<ApiResponse<Post>>(`/posts/${id}`);
  if (!data.success || !data.data) throw new Error(data.error || 'Post not found');
  return data.data;
}

export async function createPost(
  post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>('/posts', post);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create post');
  return data.data;
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post> {
  const { data } = await api.put<ApiResponse<Post>>(`/posts/${id}`, updates);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update post');
  return data.data;
}

export async function deletePost(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/posts/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete post');
}

export async function publishPost(id: string, platforms: string[]): Promise<PublishResult[]> {
  const { data } = await api.post<ApiResponse<PublishResult[]>>(`/posts/${id}/publish`, {
    platforms,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to publish');
  return data.data;
}

export async function schedulePost(id: string, scheduledAt: string): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>(`/posts/${id}/schedule`, {
    scheduledAt,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to schedule');
  return data.data;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export async function getPostComments(id: string): Promise<PostComment[]> {
  const { data } = await api.get<ApiResponse<PostComment[]>>(`/posts/${id}/comments`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get comments');
  return data.data;
}

export async function addPostComment(id: string, content: string): Promise<PostComment> {
  const { data } = await api.post<ApiResponse<PostComment>>(`/posts/${id}/comments`, { content });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to add comment');
  return data.data;
}

export async function updatePostStatus(id: string, status: string): Promise<Post> {
  const { data } = await api.patch<ApiResponse<Post>>(`/posts/${id}/status`, { status });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update status');
  return data.data;
}

export async function approvePost(id: string): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>(`/posts/${id}/approve`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to approve post');
  return data.data;
}

export async function rejectPost(id: string, feedback: string): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>(`/posts/${id}/reject`, { feedback });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to reject post');
  return data.data;
}

// --- Settings ---

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get<ApiResponse<Settings>>('/settings');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load settings');
  return data.data;
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const { data } = await api.put<ApiResponse<Settings>>('/settings', settings);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to save settings');
  return data.data;
}

export interface AccountExportDownload {
  blob: Blob;
  filename: string;
}

export async function exportAccountData(): Promise<AccountExportDownload> {
  const response = await api.get<Blob>('/auth/export', {
    responseType: 'blob',
  });
  const contentDisposition = response.headers['content-disposition'];
  const filenameMatch =
    typeof contentDisposition === 'string'
      ? /filename="(?<filename>[^"]+)"/.exec(contentDisposition)
      : null;

  let blob = response.data;
  if (blob.type !== 'application/json') {
    const parsed = JSON.parse(await blob.text()) as ApiResponse<ExportedAccountData>;
    if (!parsed.success) {
      throw new Error(parsed.error || 'Failed to export account data');
    }

    blob = new Blob([JSON.stringify(parsed.data, null, 2)], {
      type: 'application/json',
    });
  }

  return {
    blob,
    filename: filenameMatch?.groups?.filename || 'postcommander-export.json',
  };
}

export async function deleteAccount(
  password: string,
  confirmation: 'DELETE',
): Promise<{ message: string }> {
  const { data } = await api.delete<ApiResponse<{ message: string }>>('/auth/account', {
    data: {
      password,
      confirmation,
    },
  });
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to delete account');
  }
  return data.data;
}

export interface DeletedAccountsSearchParams {
  email?: string;
  originalUserId?: string;
  stripeCustomerId?: string;
  limit?: number;
}

export async function getDeletedAccounts(
  params: DeletedAccountsSearchParams = {},
): Promise<DeletedAccountAudit[]> {
  const { data } = await api.get<ApiResponse<{ audits: DeletedAccountAudit[] }>>(
    '/admin/deleted-accounts',
    { params },
  );
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to load deleted account archives');
  }
  return data.data.audits;
}

// --- Platforms ---

export async function getPlatforms(): Promise<PlatformConnection[]> {
  const { data } = await api.get<ApiResponse<PlatformConnection[]>>('/platforms');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load platforms');
  return data.data;
}

export async function connectPlatform(platform: string): Promise<void> {
  const { data } = await api.get<ApiResponse<{ authUrl: string }>>(`/platforms/${platform}/auth`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to connect platform');

  window.location.assign(data.data.authUrl);
}

export async function disconnectPlatform(platform: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/platforms/${platform}/disconnect`);
  if (!data.success) throw new Error(data.error || 'Failed to disconnect platform');
}

// --- Viral Library ---

export interface ViralPost {
  id: string;
  content: string;
  author: string;
  authorName?: string;
  authorHandle: string;
  platform: string;
  category: string;
  language: string;
  likes: number;
  comments: number;
  shares: number;
  savedAt: string;
}

export interface ViralFilters {
  platform?: string;
  category?: string;
  language?: string;
  page?: number;
  pageSize?: number;
}

export async function getViralPosts(filters?: ViralFilters): Promise<PaginatedResponse<ViralPost>> {
  const { data } = await api.get<PaginatedResponse<ViralPost>>('/viral', {
    params: filters,
  });
  return data;
}

export async function searchViralPosts(query: string): Promise<ViralPost[]> {
  const { data } = await api.get<ApiResponse<ViralPost[]>>('/viral/search', {
    params: { q: query },
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Search failed');
  return data.data;
}

export async function getViralCategories(): Promise<string[]> {
  const { data } = await api.get<ApiResponse<string[]>>('/viral/categories');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load categories');
  return data.data;
}

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

// --- AI Images ---

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  size?: string;
  postId?: string;
}

export interface GeneratedImage {
  id: string;
  postId: string | null;
  prompt: string;
  provider: string;
  imageUrl: string | null;
  imagePath: string | null;
  createdAt: string;
}

export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { data } = await api.post<ApiResponse<GeneratedImage>>('/images/generate', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Image generation failed');
  return data.data;
}

export async function getImages(postId?: string): Promise<GeneratedImage[]> {
  const { data } = await api.get<ApiResponse<GeneratedImage[]>>('/images', {
    params: postId ? { postId } : undefined,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load images');
  return data.data;
}

export async function attachImageToPost(
  imageId: string,
  postId: string | null,
): Promise<GeneratedImage> {
  const { data } = await api.patch<ApiResponse<GeneratedImage>>(`/images/${imageId}`, { postId });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update image');
  return data.data;
}

// --- Analytics ---

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

// --- Stripe / Billing ---

export interface SubscriptionInfo {
  id: string;
  plan: string;
  interval: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
}

export interface SubscriptionStatus {
  plan: string;
  planName: string;
  status: string;
  postsUsed: number;
  postsLimit: number;
  aiProviders: number;
  platforms: number;
  features: string[];
  subscription: SubscriptionInfo | null;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  url: string | null;
  pdf: string | null;
}

export interface PlanInfo {
  id: string;
  name: string;
  postsPerMonth: number;
  aiProviders: number;
  platforms: number;
  features: string[];
  prices?: {
    month: { amount: number; currency: string };
    year: { amount: number; currency: string };
  };
}

export async function createCheckout(plan: string, interval: string): Promise<{ url: string }> {
  const { data } = await api.post<ApiResponse<{ url: string }>>('/stripe/create-checkout', {
    plan,
    interval,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create checkout');
  return data.data;
}

export async function createPortal(): Promise<{ url: string }> {
  const { data } = await api.post<ApiResponse<{ url: string }>>('/stripe/create-portal', {});
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create portal session');
  return data.data;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await api.get<ApiResponse<SubscriptionStatus>>('/stripe/subscription');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get subscription');
  return data.data;
}

export async function cancelSubscription(): Promise<{ message: string }> {
  const { data } = await api.post<ApiResponse<{ message: string }>>('/stripe/cancel', {});
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to cancel subscription');
  return data.data;
}

export async function resumeSubscription(): Promise<{ message: string }> {
  const { data } = await api.post<ApiResponse<{ message: string }>>('/stripe/resume', {});
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to resume subscription');
  return data.data;
}

export async function getInvoices(): Promise<{ invoices: Invoice[] }> {
  const { data } = await api.get<ApiResponse<{ invoices: Invoice[] }>>('/stripe/invoices');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get invoices');
  return data.data;
}

export async function getPlans(): Promise<PlanInfo[]> {
  const { data } = await api.get<ApiResponse<PlanInfo[]>>('/stripe/plans');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get plans');
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

export default api;
