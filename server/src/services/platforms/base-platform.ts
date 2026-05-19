import type { PlatformId } from '@postcommander/shared';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string;
}

export interface AccountInfo {
  accountId: string;
  accountName: string;
  profileUrl?: string;
  avatarUrl?: string;
}

export interface MediaFile {
  bytes: Buffer;
  contentType: string;
}

export interface PublishOptions {
  content: string;
  accessToken: string;
  /**
   * Public URLs for platforms whose API fetches media by URL
   * (Facebook, Instagram, Pinterest). Must be HTTPS and externally
   * resolvable for those fetchers to succeed.
   */
  mediaUrls?: string[];
  /**
   * Image/video bytes for platforms that require multipart upload
   * (LinkedIn, Twitter v1.1 media endpoint). Indices correspond to mediaUrls.
   */
  mediaFiles?: MediaFile[];
}

export interface PublishResponse {
  platformPostId: string;
  platformUrl: string;
}

export interface PlatformMetrics {
  views: number;
  likes: number;
  shares: number;
  commentsCount: number;
}

export class NotImplementedError extends Error {
  constructor(platformId: string, method: string) {
    super(`${method} is not yet implemented for platform "${platformId}"`);
    this.name = 'NotImplementedError';
  }
}

export abstract class BasePlatformAdapter {
  abstract readonly platformId: PlatformId;
  abstract readonly name: string;

  abstract getAuthUrl(state: string): string;
  abstract exchangeCode(code: string): Promise<OAuthTokens>;
  abstract refreshToken(refreshToken: string): Promise<OAuthTokens>;
  abstract publishPost(options: PublishOptions): Promise<PublishResponse>;
  abstract getAccountInfo(accessToken: string): Promise<AccountInfo>;

  /**
   * Fetch current public metrics for a published post. Default implementation
   * throws NotImplementedError — adapters opt in by overriding. The worker
   * dispatcher catches NotImplementedError and skips the publication, so an
   * unsupported platform is non-fatal.
   */
  async fetchAnalytics(_accessToken: string, _platformPostId: string): Promise<PlatformMetrics> {
    throw new NotImplementedError(this.platformId, 'fetchAnalytics');
  }
}
