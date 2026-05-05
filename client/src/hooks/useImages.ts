import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import toast from 'react-hot-toast';

export function useImages(postId?: string) {
  return useQuery({
    queryKey: ['images', postId ?? null],
    queryFn: () => api.getImages(postId),
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.generateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast.success('Image générée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useAttachImageToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, postId }: { imageId: string; postId: string | null }) =>
      api.attachImageToPost(imageId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
