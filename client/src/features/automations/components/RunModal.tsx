import { Loader2, Check, X, Zap, ExternalLink } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { Button } from '@/components/ui/Button';
import type { JobProgress } from '../types';

interface JobStatusLoose {
  state?: string;
  progress?: number | object;
  result?: { finalContent?: string };
  failedReason?: string;
}

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  executionOrder: Node[];
  activeJobId: string | null;
  jobStatus?: JobStatusLoose;
  elapsedSeconds: number;
}

export function RunModal({
  isOpen,
  onClose,
  executionOrder,
  activeJobId,
  jobStatus,
  elapsedSeconds,
}: RunModalProps) {
  if (!isOpen) return null;

  const progress = jobStatus?.progress as JobProgress | undefined;
  const activeNodeId = progress?.activeNodeId;
  const completedNodeIds = progress?.completedNodeIds || [];
  const runningNodeErrors = progress?.runningNodeErrors || {};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Zap size={20} className="text-brand-500 animate-pulse" />
            Test du Workflow en direct
          </h3>
          {(jobStatus?.state === 'completed' || jobStatus?.state === 'failed' || !activeJobId) && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6">

          {/* Dynamic Log status or Loader */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-850">
            <div className="flex items-center gap-3">
              {(!activeJobId || jobStatus?.state === 'waiting' || jobStatus?.state === 'active') ? (
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
              ) : jobStatus?.state === 'completed' ? (
                <Check className="w-5 h-5 text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-0.5 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-500 bg-red-100 dark:bg-red-900/30 rounded-full p-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {!activeJobId
                    ? "Déploiement du job..."
                    : jobStatus?.state === 'waiting'
                    ? "En attente dans la file..."
                    : jobStatus?.state === 'active'
                    ? "Exécution du workflow..."
                    : jobStatus?.state === 'completed'
                    ? "Exécution réussie !"
                    : "Échec de l'exécution"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {(!activeJobId || jobStatus?.state === 'waiting' || jobStatus?.state === 'active')
                    ? `Temps écoulé : ${elapsedSeconds}s (Stagehand & LLM prennent environ 20-30s)`
                    : jobStatus?.state === 'completed'
                    ? "Toutes les étapes ont été complétées."
                    : `Erreur : ${jobStatus?.failedReason || 'Inconnue'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Live Stepper */}
          <div className="space-y-4 relative pl-4 border-l border-gray-200 dark:border-gray-800 ml-2 max-h-[300px] overflow-y-auto pr-2">
            {executionOrder.map((node, index) => {
              const isCompleted = completedNodeIds.includes(node.id) || jobStatus?.state === 'completed';
              const isActive = activeNodeId === node.id || (index === 0 && !activeNodeId && jobStatus?.state === 'active');
              const errorMsg = runningNodeErrors[node.id] || (isActive && jobStatus?.state === 'failed' ? jobStatus?.failedReason : null);
              const isFailed = !!errorMsg;

              let nodeIcon = "⚙️";
              if ((node.data as any)?.type === 'trigger') nodeIcon = "⚡";
              else if (node.id.includes('ai')) nodeIcon = "✨";
              else if (node.id.includes('image')) nodeIcon = "🎨";
              else if (node.id.includes('scrape')) nodeIcon = "🕸️";
              else if (node.id.includes('loop')) nodeIcon = "🔄";
              else if (node.id.includes('post')) nodeIcon = "📝";
              else if (node.id.includes('publish')) nodeIcon = "🚀";

              return (
                <div key={node.id} className="relative pl-6">
                  <div className={`absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isFailed
                      ? 'bg-red-500 border-red-500 text-white'
                      : isActive
                      ? 'bg-brand-500 border-brand-500 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}>
                    {isCompleted ? <Check size={10} /> : isFailed ? <X size={10} /> : index + 1}
                  </div>
                  <p className={`text-xs font-semibold flex items-center gap-1.5 ${
                    isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    <span>{nodeIcon}</span>
                    <span>{(node.data as any)?.label || node.id}</span>
                    {isActive && (
                      <span className="text-[9px] font-normal text-brand-500 animate-pulse bg-brand-500/10 px-1 py-0.2 rounded-full">
                        En cours...
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {(node.data as any)?.description || `Exécution du nœud de type ${(node.data as any)?.type || 'action'}.`}
                  </p>
                  {errorMsg && (
                    <p className="text-[9px] text-red-500 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 mt-1 font-mono leading-tight">
                      Erreur : {errorMsg}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Output Preview */}
          {jobStatus?.state === 'completed' && jobStatus?.result?.finalContent && (
            <div className="space-y-2 mt-4 border-t border-gray-100 dark:border-gray-850 pt-4 animate-in slide-in-from-bottom-3 duration-300">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Contenu Généré :
              </label>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-850/80 border border-gray-200 dark:border-gray-800 text-xs text-gray-800 dark:text-gray-200 font-sans whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed">
                {jobStatus.result.finalContent}
              </div>
              <div className="flex justify-end pt-2">
                <a
                  href="/posts"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
                >
                  Voir mes brouillons <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-850 mt-4">
            <Button
              variant="secondary"
              disabled={!!(activeJobId && jobStatus?.state !== 'completed' && jobStatus?.state !== 'failed')}
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
