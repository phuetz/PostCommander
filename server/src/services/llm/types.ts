import type { PlatformId } from '@postcommander/shared';
import type { ToneId } from '@postcommander/shared';
import type { LLMProviderId } from '@postcommander/shared';

export interface LLMGenerateRequest {
  prompt: string;
  platforms: PlatformId[];
  tone: ToneId;
  provider: LLMProviderId;
  model: string;
  language: string;
}

export interface LLMBlogGenerateRequest {
  provider: LLMProviderId;
  model: string;
  topic: string;
  articleType: 'fond-technique' | 'news-comment' | 'opinion-perso';
  authorName?: string;
  authorRole?: string;
  authorContext?: string;
  authorReferences?: string[];
  catalogMatched?: string[];
  similarSources?: Array<{ source: string; url: string }>;
  language?: string;
}

export interface LLMGenerateResult {
  content: string;
  platformVariants: Record<string, string>;
  hashtags: string[];
}

export interface LLMStreamChunk {
  type: 'text-delta' | 'platform-variant' | 'hashtags' | 'done' | 'error' | 'agent-status';
  content?: string;
  platform?: string;
  hashtags?: string[];
  error?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
}
