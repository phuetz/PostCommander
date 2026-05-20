import { useEffect, useMemo, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { Send, Loader2, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

import { useChatStream, type LiveToolCall } from '../hooks/useChatStream';
import {
  useChatSessions,
  useChatMessages,
  useCreateChatSession,
  useDeleteChatSession,
} from '../hooks/useChatSessions';
import { useSaveAutomation } from '@/hooks/useAutomations';
import { MessageBubble } from './MessageBubble';
import { ChatSessionList } from './ChatSessionList';
import { WorkflowDiffPreview } from './WorkflowDiffPreview';
import { applyMutations } from '../utils/apply-mutation';

interface ChatPanelProps {
  automationId: string | undefined;
  nodes: Node[];
  edges: Edge[];
  onWorkflowUpdated: (nodes: Node[], edges: Edge[]) => void;
  onAutomationCreated?: (id: string) => void;
  activeSessionId: string | null;
  onActiveSessionChange: (id: string | null) => void;
}

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: LiveToolCall[];
}

const INITIAL_GREETING: UiMessage = {
  id: 'init',
  role: 'assistant',
  content:
    "Bonjour ! Je suis votre assistant de création de workflows. Décrivez le processus que vous voulez automatiser et je construirai le diagramme pour vous.",
};

const SUGGESTIONS = [
  { text: 'Veille automatique Hacker News et post LinkedIn', label: 'Veille HN' },
  { text: 'Scraper un site web et faire un résumé de blog', label: 'Scrape & Résume' },
  { text: "Créer une boucle sur les résultats d'une recherche Tavily", label: 'Recherche + Boucle' },
];

export function ChatPanel({
  automationId,
  nodes,
  edges,
  onWorkflowUpdated,
  onAutomationCreated,
  activeSessionId,
  onActiveSessionChange,
}: ChatPanelProps) {
  const setActiveSessionId = onActiveSessionChange;
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<UiMessage[]>([INITIAL_GREETING]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionsQuery = useChatSessions(automationId);
  const messagesQuery = useChatMessages(activeSessionId);
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const saveAutomation = useSaveAutomation();
  const stream = useChatStream();

  const sessions = sessionsQuery.data?.data ?? [];

  // Pick an active session when sessions list arrives and none selected yet.
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  // Sync local messages with the session's history. Streaming layers on top.
  useEffect(() => {
    if (!activeSessionId) {
      setLocalMessages([INITIAL_GREETING]);
      return;
    }
    const rows = messagesQuery.data?.data;
    if (!rows) return;
    const ui: UiMessage[] = rows.map((r) => ({
      id: r.id,
      role: r.role === 'assistant' ? 'assistant' : 'user',
      content: r.content,
      toolCalls: Array.isArray(r.toolCalls) ? r.toolCalls : undefined,
    }));
    setLocalMessages(ui.length > 0 ? ui : [INITIAL_GREETING]);
  }, [activeSessionId, messagesQuery.data]);

  // Auto-scroll on new messages or while streaming.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, stream.isStreaming, stream.liveText, stream.liveToolCalls]);

  const draftBubble = useMemo<UiMessage | null>(() => {
    if (!stream.isStreaming && !stream.liveText && stream.liveToolCalls.length === 0) return null;
    return {
      id: 'streaming',
      role: 'assistant',
      content: stream.liveText,
      toolCalls: stream.liveToolCalls,
    };
  }, [stream.isStreaming, stream.liveText, stream.liveToolCalls]);

  async function ensureAutomationAndSession(): Promise<{ automationId: string; sessionId: string } | null> {
    let aid = automationId;

    // Auto-create draft if needed
    if (!aid) {
      try {
        const res = await saveAutomation.mutateAsync({
          name: `Brouillon — ${new Date().toLocaleString('fr-FR')}`,
          status: 'draft',
          flowData: JSON.stringify({ nodes, edges }),
        });
        aid = res.data.id;
        onAutomationCreated?.(aid);
      } catch (e) {
        toast.error("Impossible de créer un brouillon d'automatisation");
        return null;
      }
    }

    let sid = activeSessionId;
    if (!sid) {
      try {
        const session = await createSession.mutateAsync({ automationId: aid! });
        sid = session.id;
        setActiveSessionId(sid);
      } catch (e) {
        toast.error('Impossible de créer la conversation');
        return null;
      }
    }

    return { automationId: aid!, sessionId: sid! };
  }

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || stream.isStreaming) return;

    if (!textOverride) setInput('');

    // Optimistic user bubble
    const userMsg: UiMessage = { id: `local-user-${Date.now()}`, role: 'user', content: text };
    setLocalMessages((prev) => [...prev, userMsg]);

    const setup = await ensureAutomationAndSession();
    if (!setup) {
      setLocalMessages((prev) => prev.slice(0, -1));
      return;
    }

    // History sent to the server: every message currently visible EXCEPT the local user echo
    // we just added (the server adds the user message based on its own copy).
    const historyForServer = localMessages
      .filter((m) => m.id !== 'init') // drop the canned greeting
      .map((m) => ({ id: m.id, role: m.role, content: m.content, toolCalls: m.toolCalls }));

    const result = await stream.send({
      text,
      sessionId: setup.sessionId,
      history: historyForServer,
      state: { nodes, edges },
    });

    // Finalize the assistant bubble
    if (result.text || result.toolCalls.length > 0) {
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `local-asst-${Date.now()}`,
          role: 'assistant',
          content: result.text || "J'ai mis à jour le canevas.",
          toolCalls: result.toolCalls,
        },
      ]);
    }
  }

  function handleAcceptDiff() {
    if (stream.pendingMutations.length === 0) return;
    // Prefer the server's final state if available — it includes any field we couldn't
    // reconstruct purely from mutations (e.g. positions computed server-side).
    if (stream.pendingFinalState) {
      onWorkflowUpdated(stream.pendingFinalState.nodes as Node[], stream.pendingFinalState.edges as Edge[]);
    } else {
      const next = applyMutations(nodes, edges, stream.pendingMutations);
      onWorkflowUpdated(next.nodes, next.edges);
    }
    stream.discardPending();
    toast.success("Modifications appliquées sur le canevas.", { icon: '✨' });
  }

  function handleNewSession() {
    if (!automationId) {
      // No automation yet → just reset local state. Will be created on first send.
      setActiveSessionId(null);
      setLocalMessages([INITIAL_GREETING]);
      return;
    }
    createSession.mutate(
      { automationId },
      {
        onSuccess: (session) => {
          setActiveSessionId(session.id);
          setLocalMessages([INITIAL_GREETING]);
        },
      },
    );
  }

  function handleDeleteSession(sessionId: string) {
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        if (sessionId === activeSessionId) {
          setActiveSessionId(null);
          setLocalMessages([INITIAL_GREETING]);
        }
      },
    });
  }

  const showSuggestions = localMessages.length <= 1 && !stream.isStreaming && !draftBubble;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      {automationId && (
        <ChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={(id) => setActiveSessionId(id)}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          disabled={stream.isStreaming}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} toolCalls={m.toolCalls} />
        ))}
        {draftBubble && (
          <MessageBubble role="assistant" content={draftBubble.content} toolCalls={draftBubble.toolCalls} />
        )}
        {stream.error && (
          <div className="text-[11px] text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 rounded-lg px-3 py-2">
            Erreur : {stream.error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!stream.isStreaming && stream.pendingMutations.length > 0 && (
        <WorkflowDiffPreview
          mutations={stream.pendingMutations}
          onAccept={handleAcceptDiff}
          onDiscard={stream.discardPending}
        />
      )}

      {showSuggestions && (
        <div className="px-4 py-2 space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="text-left w-full px-3 py-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 hover:bg-brand-50 dark:bg-gray-850 dark:hover:bg-brand-950/30 border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-800 rounded-lg transition-all text-ellipsis overflow-hidden whitespace-nowrap"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Décrivez votre workflow…"
          disabled={stream.isStreaming}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSend();
          }}
          className="flex-1 text-xs py-2 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-850 hover:border-gray-300 focus:border-brand-500 rounded-lg"
        />
        {stream.isStreaming ? (
          <Button
            onClick={stream.abort}
            className="p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-gray-600 hover:bg-gray-700 text-white shrink-0 shadow-sm"
            title="Arrêter"
          >
            <Square size={12} />
          </Button>
        ) : (
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 text-white shrink-0 shadow-sm"
          >
            <Send size={14} />
          </Button>
        )}
        {stream.isStreaming && (
          <div className="text-[10px] text-brand-500 flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
