import { X, CheckCircle2, XCircle, Loader2, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAutomationRuns, type AutomationRun } from '../hooks/useAutomationRuns';

interface ExecutionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  automationId: string | undefined;
  onReplay?: () => void;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60_000)} m ${Math.floor((ms % 60_000) / 1000)} s`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleString('fr-FR');
}

function StatusPill({ status }: { status: AutomationRun['status'] }) {
  const map: Record<AutomationRun['status'], { label: string; classes: string; Icon: any }> = {
    queued: {
      label: 'En attente',
      classes: 'bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400',
      Icon: Loader2,
    },
    running: {
      label: 'En cours',
      classes: 'bg-brand-100 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300',
      Icon: Loader2,
    },
    completed: {
      label: 'Réussi',
      classes: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
      Icon: CheckCircle2,
    },
    failed: {
      label: 'Échec',
      classes: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
      Icon: XCircle,
    },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${m.classes}`}>
      <m.Icon size={9} className={status === 'running' || status === 'queued' ? 'animate-spin' : ''} />
      {m.label}
    </span>
  );
}

function RunRow({ run }: { run: AutomationRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-850 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors"
      >
        <StatusPill status={run.status} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 dark:text-gray-100">
            {formatRelative(run.startedAt)}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            Durée : {formatDuration(run.durationMs)} · Job {run.jobId.slice(-8)}
          </div>
        </div>
        {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {run.errorMessage && (
            <div className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded p-2 font-mono">
              {run.errorMessage}
            </div>
          )}
          {run.summary && (
            <details className="text-[10px]">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-300 font-semibold">
                Résultat (JSON)
              </summary>
              <pre className="mt-1.5 p-2 rounded bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 overflow-x-auto text-[9px] font-mono">
                {JSON.stringify(run.summary, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function ExecutionHistoryPanel({ open, onClose, automationId, onReplay }: ExecutionHistoryPanelProps) {
  const query = useAutomationRuns(automationId, { enabled: open });

  if (!open) return null;

  const runs = query.data?.data ?? [];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Historique d'exécution</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">20 derniers runs</p>
        </div>
        <div className="flex items-center gap-1">
          {onReplay && automationId && (
            <button
              type="button"
              onClick={onReplay}
              title="Relancer le workflow"
              className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
            >
              <Play size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!automationId ? (
          <div className="p-6 text-center text-[11px] text-gray-500">
            Sauvegardez l'automatisation pour voir l'historique.
          </div>
        ) : query.isLoading ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-500" size={16} />
          </div>
        ) : query.error ? (
          <div className="p-6 text-center text-[11px] text-red-500">
            Erreur de chargement de l'historique.
          </div>
        ) : runs.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-gray-500">
            Aucun run encore — lancez votre premier test !
          </div>
        ) : (
          runs.map((run) => <RunRow key={run.id} run={run} />)
        )}
      </div>
    </div>
  );
}
