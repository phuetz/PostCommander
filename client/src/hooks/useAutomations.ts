import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '../contexts/WorkspaceContext';

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
      const res = await fetch(`/api/automations`);
      if (!res.ok) throw new Error('Failed to fetch automations');
      return res.json();
    },
    enabled: !!currentWorkspace?.id,
  });
}

export function useSaveAutomation() {
  const queryClient = useQueryClient();
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return useMutation({
    mutationFn: async (data: Partial<FlowAutomation>) => {
      const res = await fetch(`/api/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save automation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', currentWorkspace?.id] });
    },
  });
}

export function useTriggerAutomation() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automations/${id}/trigger`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to trigger automation');
      }
      return res.json();
    },
  });
}
