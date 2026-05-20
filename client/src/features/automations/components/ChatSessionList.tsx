import { useState } from 'react';
import { ChevronDown, Plus, Trash2, MessageSquare } from 'lucide-react';
import type { ChatSession } from '../hooks/useChatSessions';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  disabled?: boolean;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString('fr-FR');
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  onSelect,
  onNewSession,
  onDeleteSession,
  disabled,
}: ChatSessionListProps) {
  const [open, setOpen] = useState(false);
  const active = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          className="flex-1 flex items-center gap-1.5 text-left text-[11px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-850 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
        >
          <MessageSquare size={11} className="text-brand-500 shrink-0" />
          <span className="truncate flex-1">{active?.title ?? 'Nouvelle conversation'}</span>
          <ChevronDown size={11} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => {
            onNewSession();
            setOpen(false);
          }}
          disabled={disabled}
          title="Nouvelle conversation"
          className="p-1.5 rounded-md text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-gray-850 transition-colors disabled:opacity-50"
        >
          <Plus size={13} />
        </button>
      </div>

      {open && sessions.length > 0 && (
        <div className="absolute z-30 top-full left-2 right-2 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-850 ${
                  isActive ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''
                }`}
                onClick={() => {
                  onSelect(session.id);
                  setOpen(false);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-semibold truncate ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-800 dark:text-gray-100'}`}>
                    {session.title}
                  </div>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500">
                    {formatRelative(session.lastMessageAt || session.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  title="Supprimer cette conversation"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
