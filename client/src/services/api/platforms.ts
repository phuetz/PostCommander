import type { ApiResponse, PlatformConnection } from '@postcommander/shared';
import { api } from './_client.js';

export async function getPlatforms(): Promise<PlatformConnection[]> {
  const { data } = await api.get<ApiResponse<PlatformConnection[]>>('/platforms');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load platforms');
  return data.data;
}

export async function connectPlatform(platform: string): Promise<void> {
  const { data } = await api.get<ApiResponse<{ authUrl: string }>>(`/platforms/${platform}/auth`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to connect platform');
  window.location.assign(data.data.authUrl);
}

export async function disconnectPlatform(platform: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/platforms/${platform}/disconnect`);
  if (!data.success) throw new Error(data.error || 'Failed to disconnect platform');
}
