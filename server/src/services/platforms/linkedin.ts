import { config } from '../../config/env.js';
import type { OAuthTokenResponse } from '../../types/platforms.js';
import {
  BasePlatformAdapter,
  type OAuthTokens,
  type AccountInfo,
  type PublishOptions,
  type PublishResponse,
} from './base-platform.js';

export class LinkedInAdapter extends BasePlatformAdapter {
  readonly platformId = 'linkedin' as const;
  readonly name = 'LinkedIn';

  private get clientId(): string {
    return config.LINKEDIN_CLIENT_ID ?? '';
  }

  private get clientSecret(): string {
    return config.LINKEDIN_CLIENT_SECRET ?? '';
  }

  private get redirectUri(): string {
    return `${config.BASE_URL}/api/platforms/linkedin/callback`;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      scope: 'openid profile email w_member_social',
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const response = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LinkedIn token exchange failed: ${text}`);
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
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LinkedIn token refresh failed: ${text}`);
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

  /**
   * Upload an image asset to LinkedIn and return its asset URN.
   * Three-step flow: registerUpload → PUT bytes → return assetURN.
   * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/vector-asset-api
   */
  private async uploadImageAsset(
    accessToken: string,
    authorUrn: string,
    file: { bytes: Buffer; contentType: string },
  ): Promise<string> {
    // 1. Register upload
    const registerResponse = await fetch(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorUrn,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      },
    );

    if (!registerResponse.ok) {
      const text = await registerResponse.text();
      throw new Error(`LinkedIn asset register failed: ${text}`);
    }

    const registerData = (await registerResponse.json()) as Record<string, any>;
    const uploadUrl =
      registerData?.value?.uploadMechanism?.[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ]?.uploadUrl;
    const assetUrn = registerData?.value?.asset;

    if (!uploadUrl || !assetUrn) {
      throw new Error('LinkedIn asset register returned an unexpected payload');
    }

    // 2. PUT the bytes
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.contentType,
      },
      body: new Uint8Array(file.bytes),
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      throw new Error(`LinkedIn asset upload failed (${uploadResponse.status}): ${text}`);
    }

    return assetUrn as string;
  }

  async publishPost(options: PublishOptions): Promise<PublishResponse> {
    // Get the user's LinkedIn URN
    const meResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${options.accessToken}` },
    });

    if (!meResponse.ok) {
      throw new Error('Failed to get LinkedIn user info');
    }

    const me = (await meResponse.json()) as Record<string, any>;
    const authorUrn = `urn:li:person:${me.sub}`;

    // If images are provided, register + upload each as an asset and attach.
    const mediaAssets: string[] = [];
    if (options.mediaFiles && options.mediaFiles.length > 0) {
      for (const file of options.mediaFiles) {
        const assetUrn = await this.uploadImageAsset(options.accessToken, authorUrn, file);
        mediaAssets.push(assetUrn);
      }
    }

    const postBody: Record<string, any> = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: options.content },
          shareMediaCategory: mediaAssets.length > 0 ? 'IMAGE' : 'NONE',
          ...(mediaAssets.length > 0 && {
            media: mediaAssets.map((urn) => ({
              status: 'READY',
              media: urn,
            })),
          }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LinkedIn publish failed: ${text}`);
    }

    const result = (await response.json()) as Record<string, any>;
    const postId = result.id;

    return {
      platformPostId: postId,
      platformUrl: `https://www.linkedin.com/feed/update/${postId}`,
    };
  }

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn account info');
    }

    const data = (await response.json()) as Record<string, any>;

    return {
      accountId: data.sub,
      accountName: data.name ?? `${data.given_name} ${data.family_name}`,
      profileUrl: `https://www.linkedin.com/in/${data.sub}`,
      avatarUrl: data.picture,
    };
  }
}
