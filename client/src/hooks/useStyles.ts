import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import toast from 'react-hot-toast';

export function useStyles() {
  return useQuery({
    queryKey: ['styles'],
    queryFn: api.getStyles,
  });
}

export function useStyle(id: string) {
  return useQuery({
    queryKey: ['style', id],
    queryFn: () => api.getStyle(id),
    enabled: !!id,
  });
}

export function useCreateStyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createStyle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      toast.success("Style d'écriture créé et analysé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteStyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteStyle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styles'] });
      toast.success('Style supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useGenerateWithStyle() {
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: api.GenerateWithStyleParams }) =>
      api.generateWithStyle(id, params),
    onSuccess: () => {
      toast.success('Contenu généré avec votre style');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
