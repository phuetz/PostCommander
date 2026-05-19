import type {
  Post,
  PublishResult,
  ApiResponse,
  PaginatedResponse,
} from '@postcommander/shared';
import { api } from './_client.js';

// --- Posts CRUD ---

export async function getPosts(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  platform?: string;
  search?: string;
}): Promise<PaginatedResponse<Post>> {
  const { data } = await api.get<PaginatedResponse<Post>>('/posts', { params });
  return data;
}

export async function getPost(id: string): Promise<Post> {
  const { data } = await api.get<ApiResponse<Post>>(`/posts/${id}`);
  if (!data.success || !data.data) throw new Error(data.error || 'Post not found');
  return data.data;
}

export async function createPost(
  post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>('/posts', post);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create post');
  return data.data;
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post> {
  const { data } = await api.put<ApiResponse<Post>>(`/posts/${id}`, updates);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update post');
  return data.data;
}

export async function deletePost(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse>(`/posts/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete post');
}

export async function publishPost(id: string, platforms: string[]): Promise<PublishResult[]> {
  const { data } = await api.post<ApiResponse<PublishResult[]>>(`/posts/${id}/publish`, {
    platforms,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to publish');
  return data.data;
}

export async function schedulePost(id: string, scheduledAt: string): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>(`/posts/${id}/schedule`, {
    scheduledAt,
  });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to schedule');
  return data.data;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export async function getPostComments(id: string): Promise<PostComment[]> {
  const { data } = await api.get<ApiResponse<PostComment[]>>(`/posts/${id}/comments`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to get comments');
  return data.data;
}

export async function addPostComment(id: string, content: string): Promise<PostComment> {
  const { data } = await api.post<ApiResponse<PostComment>>(`/posts/${id}/comments`, { content });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to add comment');
  return data.data;
}

export async function updatePostStatus(id: string, status: string): Promise<Post> {
  const { data } = await api.patch<ApiResponse<Post>>(`/posts/${id}/status`, { status });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update status');
  return data.data;
}

export async function approvePost(id: string): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>(`/posts/${id}/approve`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to approve post');
  return data.data;
}

export async function rejectPost(id: string, feedback: string): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>(`/posts/${id}/reject`, { feedback });
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to reject post');
  return data.data;
}
