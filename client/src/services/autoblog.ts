import axios from 'axios';
import type { ApiResponse } from '@postcommander/shared';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AutoBlogConfig {
  id: string;
  userId: string;
  workspaceId: string;
  topic: string;
  articleType: string;
  frequency: string;
  provider: string;
  model: string;
  authorName?: string;
  authorRole?: string;
  authorReferences?: string;
  status: 'active' | 'paused';
  lastGeneratedAt?: string;
  createdAt: string;
}

export type CreateAutoBlogConfigData = Omit<AutoBlogConfig, 'id' | 'userId' | 'workspaceId' | 'lastGeneratedAt' | 'createdAt' | 'updatedAt'>;

export async function getAutoBlogConfigs(): Promise<AutoBlogConfig[]> {
  const { data } = await api.get<ApiResponse<AutoBlogConfig[]>>('/autoblog');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load configs');
  return data.data;
}

export async function createAutoBlogConfig(config: CreateAutoBlogConfigData): Promise<AutoBlogConfig> {
  const { data } = await api.post<ApiResponse<AutoBlogConfig>>('/autoblog', config);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create config');
  return data.data;
}

export async function updateAutoBlogConfig(id: string, updates: Partial<AutoBlogConfig>): Promise<AutoBlogConfig> {
  const { data } = await api.put<ApiResponse<AutoBlogConfig>>(`/autoblog/${id}`, updates);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update config');
  return data.data;
}

export async function deleteAutoBlogConfig(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/autoblog/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete config');
}
