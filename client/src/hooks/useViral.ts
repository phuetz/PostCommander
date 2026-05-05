import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api';

export function useViralPosts(params?: Parameters<typeof api.getViralPosts>[0]) {
  return useQuery({
    queryKey: ['viral-posts', params],
    queryFn: () => api.getViralPosts(params),
  });
}

export function useViralCategories() {
  return useQuery({
    queryKey: ['viral-categories'],
    queryFn: api.getViralCategories,
  });
}

export function useSearchViralPosts(query: string) {
  return useQuery({
    queryKey: ['viral-search', query],
    queryFn: () => api.searchViralPosts(query),
    enabled: !!query && query.length >= 3,
  });
}
