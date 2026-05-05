import { config } from '../../config/env.js';
import type { OAuthTokenResponse } from '../../types/platforms.js';
import {
  BasePlatformAdapter,
  type OAuthTokens,
  type AccountInfo,
  type PublishOptions,
  type PublishResponse,
} from './base-platform.js';

export class TikTokAdapter extends BasePlatformAdapter {
  readonly platformId = 'tiktok' as const;
  readonly name = 'TikTok';

  private get clientKey(): string {
    return config.TIKTOK_CLIENT_KEY ?? '';
  }

  private get clientSecret(): string {
    return config.TIKTOK_CLIENT_SECRET ?? '';
  }

  private get redirectUri(): string {
    return `${config.BASE_URL}/api/platforms/tiktok/callback`;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      response_type: 'code',
      scope: 'user.info.basic,video.publish,video.upload',
      redirect_uri: this.redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/oauth/token/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TikTok token exchange failed: ${text}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = new Date(
      Date.now() + (data.expires_in as number) * 1000,
    ).toISOString();

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string,
      expiresAt,
      scopes: data.scope as string,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/oauth/token/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TikTok token refresh failed: ${text}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = new Date(
      Date.now() + (data.expires_in as number) * 1000,
    ).toISOString();

    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) ?? refreshToken,
      expiresAt,
      scopes: data.scope as string,
    };
  }

  async publishPost(options: PublishOptions): Promise<PublishResponse> {
    // TikTok only supports video publishing — text-only is not supported.
    // The Content Posting API requires uploading a video.
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      throw new Error(
        'TikTok requires a video file. Text-only posts are not supported.',
      );
    }

    // Step 1: Initialize the upload
    const initResponse = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: options.mediaUrls[0],
          },
          post_info: {
            title: options.content.slice(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
          },
        }),
      },
    );

    if (!initResponse.ok) {
      const text = await initResponse.text();
      throw new Error(`TikTok publish failed: ${text}`);
    }

    const initData = (await initResponse.json()) as Record<string, any>;
    const publishId = initData.data?.publish_id;

    return {
      platformPostId: publishId ?? 'pending',
      platformUrl: 'https://www.tiktok.com',
    };
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,profile_deep_link',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to get TikTok account info');
    }

    const data = (await response.json()) as Record<string, any>;
    const user = data.data?.user;

    return {
      accountId: user?.open_id ?? '',
      accountName: user?.display_name ?? 'TikTok User',
      profileUrl: user?.profile_deep_link,
      avatarUrl: user?.avatar_url,
    };
  }
}
