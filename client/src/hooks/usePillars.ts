import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api';
import toast from 'react-hot-toast';

export function usePillars() {
  return useQuery({
    queryKey: ['pillars'],
    queryFn: api.getPillars,
  });
}

export function usePillarIdeas(pillarId: string) {
  return useQuery({
    queryKey: ['pillar-ideas', pillarId],
    queryFn: () => api.getPillarIdeas(pillarId),
    enabled: !!pillarId,
  });
}

export function useCreatePillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPillarApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      toast.success('Pilier de contenu créé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdatePillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.CreatePillarParams }) =>
      api.updatePillarApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      toast.success('Pilier mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeletePillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePillarApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      toast.success('Pilier supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pillarId, data }: { pillarId: string; data: { title: string } }) =>
      api.createIdeaApi(pillarId, data),
    onSuccess: (_, { pillarId }) => {
      queryClient.invalidateQueries({ queryKey: ['pillar-ideas', pillarId] });
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      toast.success('Idée ajoutée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ideaId, data }: { ideaId: string; data: api.UpdateIdeaParams }) =>
      api.updateIdeaApi(ideaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      // Note: we don't know the pillarId here to invalidate specific ideas list,
      // but usually the page will refresh pillars which includes counts
      queryClient.invalidateQueries({ queryKey: ['pillar-ideas'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteIdeaApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      queryClient.invalidateQueries({ queryKey: ['pillar-ideas'] });
      toast.success('Idée supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useGenerateIdeas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pillarId, params }: { pillarId: string; params: api.GenerateIdeasParams }) =>
      api.generateIdeasApi(pillarId, params),
    onSuccess: (_, { pillarId }) => {
      queryClient.invalidateQueries({ queryKey: ['pillar-ideas', pillarId] });
      queryClient.invalidateQueries({ queryKey: ['pillars'] });
      toast.success('Idées générées avec succès !');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
