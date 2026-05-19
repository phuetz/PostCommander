import { config } from '../../config/env.js';
import type { OAuthTokenResponse } from '../../types/platforms.js';
import {
  BasePlatformAdapter,
  type OAuthTokens,
  type AccountInfo,
  type PublishOptions,
  type PublishResponse,
  type PlatformMetrics,
} from './base-platform.js';

export class PinterestAdapter extends BasePlatformAdapter {
  readonly platformId = 'pinterest' as const;
  readonly name = 'Pinterest';

  private get clientId(): string {
    return config.PINTEREST_APP_ID ?? '';
  }

  private get clientSecret(): string {
    return config.PINTEREST_APP_SECRET ?? '';
  }

  private get redirectUri(): string {
    return `${config.BASE_URL}/api/platforms/pinterest/callback`;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'boards:read,pins:read,pins:write,user_accounts:read',
      state,
    });
    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pinterest token exchange failed: ${text}`);
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

    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
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
      throw new Error(`Pinterest token refresh failed: ${text}`);
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

  async publishPost(options: PublishOptions): Promise<PublishResponse> {
    // Pinterest requires an image to create a pin
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      throw new Error('Pinterest requires an image. Text-only pins are not supported.');
    }

    // First get the user's boards
    const boardsResponse = await fetch('https://api.pinterest.com/v5/boards', {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    });

    if (!boardsResponse.ok) {
      throw new Error('Failed to get Pinterest boards');
    }

    const boardsData = (await boardsResponse.json()) as Record<string, any>;
    const board = boardsData.items?.[0];

    if (!board) {
      throw new Error('No Pinterest boards found. Please create a board first.');
    }

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        board_id: board.id,
        title: options.content.slice(0, 100),
        description: options.content,
        media_source: {
          source_type: 'image_url',
          url: options.mediaUrls[0],
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pinterest publish failed: ${text}`);
    }

    const data = (await response.json()) as Record<string, any>;

    return {
      platformPostId: data.id,
      platformUrl: `https://www.pinterest.com/pin/${data.id}`,
    };
  }

  /**
   * Fetch pin analytics via the v5 endpoint. Pinterest requires a date range
   * (we use the last 30 days), then returns `all.daily_metrics` aggregated or
   * `all.summary_metrics`. We sum metrics across the window for the worker's
   * "set, not add" model — Pinterest's API itself does not expose a single
   * cumulative-since-creation count.
   * Requires the `pins:read` + `user_accounts:read` scopes on the connection.
   */
  async fetchAnalytics(accessToken: string, platformPostId: string): Promise<PlatformMetrics> {
    const endDate = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startDate = start.toISOString().slice(0, 10);

    const url =
      `https://api.pinterest.com/v5/pins/${encodeURIComponent(platformPostId)}/analytics` +
      `?start_date=${startDate}&end_date=${endDate}` +
      `&metric_types=IMPRESSION,SAVE,PIN_CLICK,REACTION`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pinterest analytics fetch failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      all?: {
        summary_metrics?: {
          IMPRESSION?: number;
          SAVE?: number;
          PIN_CLICK?: number;
          REACTION?: number;
        };
      };
    };

    const m = data.all?.summary_metrics ?? {};
    return {
      views: m.IMPRESSION ?? 0,
      // Pinterest's "engagement" model differs from sociaux classiques: saves
      // (re-pins) are the closest analogue to "likes/shares". We map SAVE to
      // both `likes` and `shares` of PlatformMetrics — the UI knows it's PT.
      likes: m.REACTION ?? 0,
      shares: m.SAVE ?? 0,
      commentsCount: 0, // Pinterest comments are scarce + not exposed in analytics
    };
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get Pinterest account info');
    }

    const data = (await response.json()) as Record<string, any>;

    return {
      accountId: data.username ?? data.id,
      accountName: data.username ?? data.business_name ?? 'Pinterest User',
      profileUrl: `https://www.pinterest.com/${data.username}`,
      avatarUrl: data.profile_image,
    };
  }
}
