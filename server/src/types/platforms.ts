export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  [key: string]: unknown;
}

export interface SocialProfileResponse {
  id?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
}

export interface SocialPublishResponse {
  id?: string;
  [key: string]: unknown;
}
