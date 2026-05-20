import { Check, X, Plus, Pencil, Trash2, Link2, Unlink } from 'lucide-react';
import type { WorkflowMutation } from '../hooks/useChatStream';
import { describeMutation } from '../utils/apply-mutation';

interface WorkflowDiffPreviewProps {
  mutations: WorkflowMutation[];
  onAccept: () => void;
  onDiscard: () => void;
}

function mutationIcon(kind: WorkflowMutation['kind']) {
  switch (kind) {
    case 'add':
      return { Icon: Plus, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    case 'update':
      return { Icon: Pencil, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950/30' };
    case 'delete':
      return { Icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' };
    case 'connect':
      return { Icon: Link2, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' };
    case 'disconnect':
      return { Icon: Unlink, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' };
  }
}

export function WorkflowDiffPreview({ mutations, onAccept, onDiscard }: WorkflowDiffPreviewProps) {
  if (mutations.length === 0) return null;

  return (
    <div className="mx-4 mb-3 rounded-xl border border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-950/20 p-3 space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 flex items-center gap-1.5">
          <span>L'IA propose {mutations.length} modification{mutations.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDiscard}
            className="px-2 py-1 text-[10px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850 rounded transition-colors flex items-center gap-1"
          >
            <X size={11} />
            Refuser
          </button>
          <button
            onClick={onAccept}
            className="px-2.5 py-1 text-[10px] font-bold text-white bg-brand-600 hover:bg-brand-700 rounded transition-colors flex items-center gap-1 shadow-sm"
          >
            <Check size={11} />
            Accepter
          </button>
        </div>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {mutations.map((m, idx) => {
          const meta = mutationIcon(m.kind);
          if (!meta) return null;
          const { Icon, color, bg } = meta;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg ${bg} text-[10px] text-gray-700 dark:text-gray-200`}
            >
              <Icon size={11} className={color} />
              <span className="truncate">{describeMutation(m)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
