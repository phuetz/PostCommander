import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import { Post, PlatformId } from '@postcommander/shared';
import toast from 'react-hot-toast';

export function usePosts(params?: Parameters<typeof api.getPosts>[0]) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => api.getPosts(params),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => api.getPost(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Post> }) =>
      api.updatePost(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast.success('Post mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, platforms }: { id: string; platforms: PlatformId[] }) =>
      api.publishPost(id, platforms),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      const successCount = results.filter((r) => r.success).length;
      if (successCount === results.length) {
        toast.success('Post publié avec succès sur toutes les plateformes');
      } else if (successCount > 0) {
        toast.success(`Post publié sur ${successCount}/${results.length} plateformes`);
      } else {
        toast.error('Échec de la publication sur toutes les plateformes');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function usePostComments(id: string) {
  return useQuery({
    queryKey: ['post-comments', id],
    queryFn: () => api.getPostComments(id),
    enabled: !!id,
  });
}

export function useAddPostComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.addPostComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', id] });
      toast.success('Commentaire ajouté');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updatePostStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useApprovePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approvePost(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((post: any) => 
            post.id === id ? { ...post, status: 'approved' } : post
          )
        };
      });
      return { previousPosts };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      toast.error(`Erreur: ${error.message}`);
    },
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
    onSuccess: () => {
      toast.success('Post approuvé');
    },
  });
}

export function useRejectPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) => api.rejectPost(id, feedback),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((post: any) => 
            post.id === id ? { ...post, status: 'rejected' } : post
          )
        };
      });
      return { previousPosts };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      toast.error(`Erreur: ${error.message}`);
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
    onSuccess: () => {
      toast.success('Post rejeté');
    },
  });
}
