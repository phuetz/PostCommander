import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from '@/services/api';
import toast from 'react-hot-toast';

export function useTemplates(params?: Parameters<typeof api.getTemplates>[0]) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => api.getTemplates(params),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.getTemplate(id),
    enabled: !!id,
  });
}

export function useGenerateFromTemplate() {
  return useMutation({
    mutationFn: ({ id, variables, provider, model }: { 
      id: string; 
      variables: Record<string, string>;
      provider?: string;
      model?: string;
    }) => api.useTemplate(id, variables, provider, model),
    onSuccess: () => {
      toast.success('Contenu généré avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
