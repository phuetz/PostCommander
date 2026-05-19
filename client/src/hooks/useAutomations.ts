import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '../contexts/WorkspaceContext';
import api from '@/services/api';

export interface FlowAutomation {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  status: 'draft' | 'active';
  flowData: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function useAutomations() {
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return useQuery<{ data: FlowAutomation[] }>({
    queryKey: ['automations', currentWorkspace?.id],
    queryFn: async () => {
      const { data } = await api.get<{ data: FlowAutomation[] }>('/automations');
      return data;
    },
    enabled: !!currentWorkspace?.id,
  });
}

export function useSaveAutomation() {
  const queryClient = useQueryClient();
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return useMutation({
    mutationFn: async (automationData: Partial<FlowAutomation>) => {
      const { data } = await api.post<{ data: FlowAutomation }>('/automations', automationData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', currentWorkspace?.id] });
    },
  });
}

export function useTriggerAutomation() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ message: string; jobId: string }>(`/automations/${id}/trigger`);
      return data;
    },
  });
}
