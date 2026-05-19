import type { ApiResponse } from '@postcommander/shared';
import { api } from './_client.js';

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  size?: string;
  postId?: string;
}

export interface GeneratedImage {
  id: string;
  postId: string | null;
  prompt: string;
  provider: string;
  imageUrl: string | null;
  imagePath: string | null;
  createdAt: string;
}

export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const { data } = await api.post<ApiResponse<GeneratedImage>>('/images/generate', params);
  if (!data.success || !data.data) throw new Error(data.error || 'Image generation failed');
  return data.data;
}

export async function getImages(postId?: string): Promise<GeneratedImage[]> {
  const { data } = await api.get<ApiResponse<GeneratedImage[]>>('/images', {
    params: postId ? { postId } : undefined,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load images');
  return data.data;
}

export async function attachImageToPost(
  imageId: string,
  postId: string | null,
): Promise<GeneratedImage> {
  const { data } = await api.patch<ApiResponse<GeneratedImage>>(`/images/${imageId}`, { postId });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update image');
  return data.data;
}
