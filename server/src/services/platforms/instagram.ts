import { config } from '../../config/env.js';
import type { OAuthTokenResponse } from '../../types/platforms.js';
import {
  BasePlatformAdapter,
  type OAuthTokens,
  type AccountInfo,
  type PublishOptions,
  type PublishResponse,
} from './base-platform.js';

export class InstagramAdapter extends BasePlatformAdapter {
  readonly platformId = 'instagram' as const;
  readonly name = 'Instagram';

  private get clientId(): string {
    return config.INSTAGRAM_APP_ID ?? '';
  }

  private get clientSecret(): string {
    return config.INSTAGRAM_APP_SECRET ?? '';
  }

  private get redirectUri(): string {
    return `${config.BASE_URL}/api/platforms/instagram/callback`;
  }

  getAuthUrl(state: string): string {
    // Instagram uses Facebook OAuth (Meta Business SDK)
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope:
        'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Instagram token exchange failed: ${text}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = data.expires_in
      ? new Date(Date.now() + (data.expires_in as number) * 1000).toISOString()
      : undefined;

    return {
      accessToken: data.access_token as string,
      expiresAt,
    };
  }

  async refreshToken(currentToken: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: currentToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Instagram token refresh failed: ${text}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = data.expires_in
      ? new Date(Date.now() + (data.expires_in as number) * 1000).toISOString()
      : undefined;

    return {
      accessToken: data.access_token as string,
      expiresAt,
    };
  }

  async publishPost(options: PublishOptions): Promise<PublishResponse> {
    // Instagram requires media for posts — text-only posts are not supported via API.
    // For text posts, we would need to create an image with the text and post that.
    // Here we implement the flow for when a media URL is provided.

    // Step 1: Get the Instagram Business Account ID
    const pagesResponse = await fetch(
      'https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account',
      {
        headers: { Authorization: `Bearer ${options.accessToken}` },
      },
    );

    if (!pagesResponse.ok) {
      throw new Error('Failed to get Instagram business account');
    }

    const pagesData = (await pagesResponse.json()) as Record<string, any>;
    const igAccountId =
      pagesData.data?.[0]?.instagram_business_account?.id;

    if (!igAccountId) {
      throw new Error(
        'No Instagram Business account found. Connect an Instagram Business account through Facebook.',
      );
    }

    // For text-only publishing, Instagram requires media.
    // We'll attempt a carousel or simple post if media URLs are provided.
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      throw new Error(
        'Instagram requires at least one image or video. Text-only posts are not supported via the API.',
      );
    }

    // Step 2: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: options.mediaUrls[0],
          caption: options.content,
          access_token: options.accessToken,
        }),
      },
    );

    if (!containerResponse.ok) {
      const text = await containerResponse.text();
      throw new Error(`Instagram media container creation failed: ${text}`);
    }

    const containerData = (await containerResponse.json()) as Record<string, any>;
    const containerId = containerData.id;

    // Step 3: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: options.accessToken,
        }),
      },
    );

    if (!publishResponse.ok) {
      const text = await publishResponse.text();
      throw new Error(`Instagram publish failed: ${text}`);
    }

    const publishData = (await publishResponse.json()) as Record<string, any>;

    return {
      platformPostId: publishData.id,
      platformUrl: `https://www.instagram.com/p/${publishData.id}`,
    };
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    // Get Instagram Business Account through Facebook Pages
    const pagesResponse = await fetch(
      'https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,name,username,profile_picture_url}',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!pagesResponse.ok) {
      throw new Error('Failed to get Instagram account info');
    }

    const pagesData = (await pagesResponse.json()) as Record<string, any>;
    const igAccount =
      pagesData.data?.[0]?.instagram_business_account;

    if (!igAccount) {
      throw new Error('No Instagram Business account found');
    }

    return {
      accountId: igAccount.id,
      accountName: igAccount.username
        ? `@${igAccount.username}`
        : igAccount.name,
      profileUrl: igAccount.username
        ? `https://www.instagram.com/${igAccount.username}`
        : undefined,
      avatarUrl: igAccount.profile_picture_url,
    };
  }
}
