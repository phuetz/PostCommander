import { config } from '../../config/env.js';
import type { OAuthTokenResponse } from '../../types/platforms.js';
import {
  BasePlatformAdapter,
  type OAuthTokens,
  type AccountInfo,
  type PublishOptions,
  type PublishResponse,
} from './base-platform.js';

export class FacebookAdapter extends BasePlatformAdapter {
  readonly platformId = 'facebook' as const;
  readonly name = 'Facebook';

  private get clientId(): string {
    return config.FACEBOOK_APP_ID ?? '';
  }

  private get clientSecret(): string {
    return config.FACEBOOK_APP_SECRET ?? '';
  }

  private get redirectUri(): string {
    return `${config.BASE_URL}/api/platforms/facebook/callback`;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: 'pages_manage_posts,pages_read_engagement,pages_show_list',
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
      throw new Error(`Facebook token exchange failed: ${text}`);
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
    // Facebook uses long-lived token exchange instead of refresh tokens
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
      throw new Error(`Facebook token refresh failed: ${text}`);
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
    // First, get the user's pages
    const pagesResponse = await fetch('https://graph.facebook.com/v19.0/me/accounts', {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    });

    if (!pagesResponse.ok) {
      throw new Error('Failed to get Facebook pages');
    }

    const pagesData = (await pagesResponse.json()) as Record<string, any>;
    const page = pagesData.data?.[0];

    if (!page) {
      throw new Error('No Facebook pages found. Please connect a page first.');
    }

    const hasImage = options.mediaUrls && options.mediaUrls.length > 0;
    // Photos endpoint with caption when an image is attached, /feed otherwise.
    // Facebook's Graph API fetches `url` server-side, so it must be public HTTPS.
    const endpoint = hasImage
      ? `https://graph.facebook.com/v19.0/${page.id}/photos`
      : `https://graph.facebook.com/v19.0/${page.id}/feed`;
    const body: Record<string, string> = hasImage
      ? {
          url: options.mediaUrls![0],
          caption: options.content,
          access_token: page.access_token,
        }
      : {
          message: options.content,
          access_token: page.access_token,
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Facebook publish failed: ${text}`);
    }

    const data = (await response.json()) as Record<string, any>;
    // /photos returns { id, post_id } where post_id is the wall post; /feed returns { id }.
    const postId = data.post_id ?? data.id;

    return {
      platformPostId: postId,
      platformUrl: `https://www.facebook.com/${postId}`,
    };
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch('https://graph.facebook.com/v19.0/me?fields=id,name,picture', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get Facebook account info');
    }

    const data = (await response.json()) as Record<string, any>;

    return {
      accountId: data.id,
      accountName: data.name,
      profileUrl: `https://www.facebook.com/${data.id}`,
      avatarUrl: data.picture?.data?.url,
    };
  }
}
