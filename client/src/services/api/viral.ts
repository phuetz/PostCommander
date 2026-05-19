import type { ApiResponse, PaginatedResponse } from '@postcommander/shared';
import { api } from './_client.js';

export interface ViralPost {
  id: string;
  content: string;
  author: string;
  authorName?: string;
  authorHandle: string;
  platform: string;
  category: string;
  language: string;
  likes: number;
  comments: number;
  shares: number;
  savedAt: string;
}

export interface ViralFilters {
  platform?: string;
  category?: string;
  language?: string;
  page?: number;
  pageSize?: number;
}

export async function getViralPosts(filters?: ViralFilters): Promise<PaginatedResponse<ViralPost>> {
  const { data } = await api.get<PaginatedResponse<ViralPost>>('/viral', { params: filters });
  return data;
}

export async function searchViralPosts(query: string): Promise<ViralPost[]> {
  const { data } = await api.get<ApiResponse<ViralPost[]>>('/viral/search', {
    params: { q: query },
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Search failed');
  return data.data;
}

export async function getViralCategories(): Promise<string[]> {
  const { data } = await api.get<ApiResponse<string[]>>('/viral/categories');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load categories');
  return data.data;
}
