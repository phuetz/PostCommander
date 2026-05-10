import { config } from '../../config/env.js';
import type { OAuthTokenResponse } from '../../types/platforms.js';
import {
  BasePlatformAdapter,
  type OAuthTokens,
  type AccountInfo,
  type PublishOptions,
  type PublishResponse,
} from './base-platform.js';

export class TwitterAdapter extends BasePlatformAdapter {
  readonly platformId = 'twitter' as const;
  readonly name = 'X / Twitter';

  private get clientId(): string {
    return config.TWITTER_CLIENT_ID ?? '';
  }

  private get clientSecret(): string {
    return config.TWITTER_CLIENT_SECRET ?? '';
  }

  private get redirectUri(): string {
    return `${config.BASE_URL}/api/platforms/twitter/callback`;
  }

  /** Twitter OAuth2 uses PKCE — for simplicity we use a fixed code_challenge approach. */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      // media.write is required for /2/media/upload (image attachment).
      scope: 'tweet.read tweet.write media.write users.read offline.access',
      state,
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code_verifier: 'challenge',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twitter token exchange failed: ${text}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = new Date(Date.now() + (data.expires_in as number) * 1000).toISOString();

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string,
      expiresAt,
      scopes: data.scope as string,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twitter token refresh failed: ${text}`);
    }

    const data = (await response.json()) as OAuthTokenResponse;
    const expiresAt = new Date(Date.now() + (data.expires_in as number) * 1000).toISOString();

    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string) ?? refreshToken,
      expiresAt,
      scopes: data.scope as string,
    };
  }

  /**
   * Upload an image to Twitter via /2/media/upload (multipart) and return media_id.
   * Requires the `media.write` OAuth scope — connections issued before this scope
   * was added must be re-authorized (disconnect/reconnect from Settings).
   * The endpoint accepts at most 5MB per image; larger files would need the
   * chunked INIT/APPEND/FINALIZE flow. If /2/media/upload returns 404 or 401,
   * /1.1/media/upload.json is the fallback (same multipart payload).
   */
  private async uploadMedia(
    accessToken: string,
    file: { bytes: Buffer; contentType: string },
  ): Promise<string> {
    if (file.bytes.byteLength > 5 * 1024 * 1024) {
      throw new Error('Twitter media upload exceeds 5MB simple-upload limit');
    }
    const form = new FormData();
    form.append(
      'media',
      new Blob([new Uint8Array(file.bytes)], { type: file.contentType }),
      'image',
    );

    const response = await fetch('https://api.twitter.com/2/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twitter media upload failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as Record<string, any>;
    const mediaId = data?.data?.id ?? data?.media_id_string ?? data?.media_id;
    if (!mediaId) {
      throw new Error('Twitter media upload returned no media_id');
    }
    return String(mediaId);
  }

  async publishPost(options: PublishOptions): Promise<PublishResponse> {
    const mediaIds: string[] = [];
    if (options.mediaFiles && options.mediaFiles.length > 0) {
      for (const file of options.mediaFiles) {
        const mediaId = await this.uploadMedia(options.accessToken, file);
        mediaIds.push(mediaId);
      }
    }

    const body: Record<string, any> = { text: options.content };
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds };
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twitter publish failed: ${text}`);
    }

    const data = (await response.json()) as Record<string, any>;
    const tweetId = data.data.id;

    return {
      platformPostId: tweetId,
      platformUrl: `https://twitter.com/i/web/status/${tweetId}`,
    };
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to get Twitter account info');
    }

    const data = (await response.json()) as Record<string, any>;

    return {
      accountId: data.data.id,
      accountName: `@${data.data.username}`,
      profileUrl: `https://twitter.com/${data.data.username}`,
      avatarUrl: data.data.profile_image_url,
    };
  }
}
