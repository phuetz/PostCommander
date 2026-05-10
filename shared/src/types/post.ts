import type { PlatformId } from '../constants/platforms.js';
import type { ToneId } from '../constants/tones.js';
import type { LLMProviderId } from '../constants/llm-providers.js';

export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed';

export interface Post {
  id: string;
  content: string;
  originalPrompt: string;
  tone: ToneId;
  originalPostId?: string | null;
  llmProvider: LLMProviderId | '';
  llmModel: string;
  platforms: PlatformId[];
  platformVariants: Record<string, string>;
  hashtags: string[];
  autoPlugContent?: string | null;
  autoPlugThreshold?: number | null;
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface SocialComment {
  id: string;
  postPublicationId: string;
  platformCommentId: string;
  authorName: string;
  authorHandle: string | null;
  authorAvatarUrl: string | null;
  content: string;
  isReplied: number;
  replyContent: string | null;
  leadScore: number | null;
  leadStatus: 'unscored' | 'unqualified' | 'potential' | 'hot';
  leadReason: string | null;
  agentState: string | null;
  requiresHuman: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface GenerateRequest {
  prompt: string;
  platforms: PlatformId[];
  tone: ToneId;
  provider: LLMProviderId;
  model: string;
  language: string;
}

export interface GenerateResponse {
  content: string;
  platformVariants: Record<string, string>;
  hashtags: string[];
}

export interface PublishResult {
  platform: PlatformId;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}
