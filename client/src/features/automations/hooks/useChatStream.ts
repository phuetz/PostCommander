import { useCallback, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import api from '@/services/api';

export type WorkflowMutation =
  | { kind: 'add'; node: any }
  | { kind: 'update'; id: string; patch: any }
  | { kind: 'delete'; id: string }
  | { kind: 'connect'; source: string; target: string; edgeId: string }
  | { kind: 'disconnect'; source: string; target: string };

export interface LiveToolCall {
  toolCallId: string;
  name: string;
  args: any;
  result?: any;
  mutation?: WorkflowMutation;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: LiveToolCall[];
  createdAt?: string;
}

interface SendOptions {
  text: string;
  sessionId?: string;
  history: ChatMessage[];
  state: { nodes: Node[]; edges: Edge[] };
}

interface UseChatStreamResult {
  isStreaming: boolean;
  liveText: string;
  liveToolCalls: LiveToolCall[];
  pendingMutations: WorkflowMutation[];
  pendingFinalState: { nodes: Node[]; edges: Edge[] } | null;
  error: string | null;
  send: (opts: SendOptions) => Promise<{ text: string; toolCalls: LiveToolCall[]; finalState: { nodes: Node[]; edges: Edge[] } | null }>;
  abort: () => void;
  discardPending: () => void;
}

/**
 * Consume the SSE stream from POST /api/automations/agent/build/stream.
 *
 * Wire format (matches generate.controller.ts):
 *   event: <name>
 *   data: <JSON>
 *   (blank line)
 *
 * Events emitted: 'text-delta', 'tool-call', 'tool-result', 'step-finish', 'done', 'error'
 */
export function useChatStream(): UseChatStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [liveToolCalls, setLiveToolCalls] = useState<LiveToolCall[]>([]);
  const [pendingMutations, setPendingMutations] = useState<WorkflowMutation[]>([]);
  const [pendingFinalState, setPendingFinalState] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const discardPending = useCallback(() => {
    setPendingMutations([]);
    setPendingFinalState(null);
  }, []);

  const send = useCallback(async ({ text, sessionId, history, state }: SendOptions) => {
    setIsStreaming(true);
    setLiveText('');
    setLiveToolCalls([]);
    setPendingMutations([]);
    setPendingFinalState(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const serverMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    // baseURL is already configured on the api axios instance — reuse it.
    const baseURL = (api.defaults.baseURL || '').replace(/\/$/, '');
    const url = `${baseURL}/automations/agent/build/stream`;
    // The WorkspaceContext sets x-workspace-id on the axios singleton; we use raw
    // fetch here so we have to forward it manually.
    const workspaceId = (api.defaults.headers.common['x-workspace-id'] as string | undefined) ?? '';

    const accumulatedToolCalls: LiveToolCall[] = [];
    const accumulatedMutations: WorkflowMutation[] = [];
    let accumulatedText = '';
    let finalState: { nodes: Node[]; edges: Edge[] } | null = null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        body: JSON.stringify({ messages: serverMessages, currentState: state, sessionId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by a blank line.
        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) >= 0) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);

          // Parse one event block: lines like "event: NAME" and "data: JSON".
          let eventName = 'message';
          let dataLine = '';
          for (const line of raw.split('\n')) {
            if (line.startsWith(':')) continue; // comment / keepalive
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;

          let payload: any;
          try {
            payload = JSON.parse(dataLine);
          } catch {
            continue;
          }

          switch (eventName) {
            case 'text-delta':
              accumulatedText += payload.delta ?? '';
              setLiveText(accumulatedText);
              break;
            case 'tool-call':
              accumulatedToolCalls.push({
                toolCallId: payload.toolCallId,
                name: payload.name,
                args: payload.args,
              });
              setLiveToolCalls([...accumulatedToolCalls]);
              break;
            case 'tool-result': {
              const idx = accumulatedToolCalls.findIndex((tc) => tc.toolCallId === payload.toolCallId);
              if (idx >= 0) {
                accumulatedToolCalls[idx].result = payload.result;
                if (payload.mutation) {
                  accumulatedToolCalls[idx].mutation = payload.mutation;
                  accumulatedMutations.push(payload.mutation);
                }
                setLiveToolCalls([...accumulatedToolCalls]);
              }
              if (payload.mutation) {
                setPendingMutations([...accumulatedMutations]);
              }
              break;
            }
            case 'step-finish':
              break;
            case 'done':
              finalState = payload.finalState ?? null;
              if (finalState) setPendingFinalState(finalState);
              break;
            case 'error':
              setError(payload.error ?? 'Stream error');
              break;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Stream failed');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }

    return { text: accumulatedText, toolCalls: accumulatedToolCalls, finalState };
  }, []);

  return {
    isStreaming,
    liveText,
    liveToolCalls,
    pendingMutations,
    pendingFinalState,
    error,
    send,
    abort,
    discardPending,
  };
}
