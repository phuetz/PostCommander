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

export abstract class BasePlatformAdapter {
  abstract readonly platformId: PlatformId;
  abstract readonly name: string;

  /**
   * Get the OAuth2 authorization URL to redirect the user to.
   */
  abstract getAuthUrl(state: string): string;

  /**
   * Exchange an authorization code for access/refresh tokens.
   */
  abstract exchangeCode(code: string): Promise<OAuthTokens>;

  /**
   * Refresh an expired access token using the refresh token.
   */
  abstract refreshToken(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Publish a post to the platform.
   */
  abstract publishPost(options: PublishOptions): Promise<PublishResponse>;

  /**
   * Retrieve information about the connected account.
   */
  abstract getAccountInfo(accessToken: string): Promise<AccountInfo>;
}
