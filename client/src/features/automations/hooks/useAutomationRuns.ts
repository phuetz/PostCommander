import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface AutomationRun {
  id: string;
  automationId: string;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  summary: any | null;
}

export function useAutomationRuns(automationId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery<{ data: AutomationRun[] }>({
    queryKey: ['automation-runs', automationId],
    queryFn: async () => {
      const { data } = await api.get<{ data: AutomationRun[] }>(
        `/automations/${automationId}/runs?limit=20`,
      );
      return data;
    },
    enabled: !!automationId && (options?.enabled ?? true),
  });
}

export function useTestNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      automationId,
      nodeId,
      mockContext,
    }: {
      automationId: string;
      nodeId: string;
      mockContext?: Record<string, any>;
    }) => {
      const { data } = await api.post<{ message: string; jobId: string }>(
        `/automations/${automationId}/nodes/${nodeId}/test`,
        { mockContext },
      );
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['automation-runs', vars.automationId] });
    },
  });
}
