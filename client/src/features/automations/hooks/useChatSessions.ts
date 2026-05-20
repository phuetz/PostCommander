import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface ChatSession {
  id: string;
  automationId: string;
  userId: string;
  workspaceId: string;
  title: string;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatMessageRow {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls: any | null;
  createdAt: string;
}

export function useChatSessions(automationId: string | undefined) {
  return useQuery<{ data: ChatSession[] }>({
    queryKey: ['chat-sessions', automationId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChatSession[] }>(`/automations/${automationId}/sessions`);
      return data;
    },
    enabled: !!automationId,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery<{ data: ChatMessageRow[] }>({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const { data } = await api.get<{ data: ChatMessageRow[] }>(`/automations/sessions/${sessionId}/messages`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ automationId, title }: { automationId: string; title?: string }) => {
      const { data } = await api.post<{ data: ChatSession }>(
        `/automations/${automationId}/sessions`,
        { title },
      );
      return data.data;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', session.automationId] });
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.delete<{ data: ChatSession }>(`/automations/sessions/${sessionId}`);
      return data.data;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', session.automationId] });
      queryClient.removeQueries({ queryKey: ['chat-messages', session.id] });
    },
  });
}
