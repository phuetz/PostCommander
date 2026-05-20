import { useRef, useState } from 'react';
import { Zap, X, Trash2, Variable, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import { Input } from '@/components/ui/Input';
import { iconMap } from '../constants/icon-map';
import { getSchemaForNode, type FieldSchema } from '../constants/node-schemas';
import { VariablePicker } from './VariablePicker';
import { useAutomationRuns } from '../hooks/useAutomationRuns';

interface NodeInspectorProps {
  selectedNode: Node;
  nodes: Node[];
  edges: Edge[];
  automationId?: string;
  updateNodeData: (nodeId: string, newData: any) => void;
  deleteNode: (nodeId: string) => void;
  onClose: () => void;
  onTestNode?: (nodeId: string) => void;
}

interface ThemeTokens {
  label: string;
  bg: string;
  text: string;
  badge: string;
}

function getTheme(type: string): ThemeTokens {
  switch (type) {
    case 'trigger':
      return {
        label: 'Déclencheur',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      };
    case 'logic':
      return {
        label: 'Logique',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      };
    default:
      return {
        label: 'Action',
        bg: 'bg-brand-50 dark:bg-brand-900/20',
        text: 'text-brand-650 dark:text-brand-400',
        badge: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
      };
  }
}

export function NodeInspector({
  selectedNode,
  nodes,
  edges,
  automationId,
  updateNodeData,
  deleteNode,
  onClose,
  onTestNode,
}: NodeInspectorProps) {
  const nodeType = (selectedNode.data as any).type || 'action';
  const theme = getTheme(nodeType);
  const iconName = (selectedNode.data as any).iconName as string | undefined;
  const SelectedIcon = iconName ? iconMap[iconName] || Zap : Zap;
  const schema = getSchemaForNode(selectedNode);

  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const { data: runsData, isLoading: runsLoading } = useAutomationRuns(automationId, {
    enabled: activeTab === 'history' && !!automationId,
  });
  const runs = runsData?.data || [];

  return (
    <aside className="w-80 bg-white/95 dark:bg-gray-900/95 border-l border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-5 overflow-y-auto z-10 absolute right-0 top-0 bottom-0 shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${theme.badge} inline-block mb-1`}>
            {theme.label}
          </span>
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 ${theme.bg} ${theme.text}`}>
              <SelectedIcon size={14} />
            </div>
            {String((selectedNode.data as any).label || '')}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 -mx-5 px-5">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 text-center ${
            activeTab === 'config'
              ? 'border-brand-500 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-gray-400 hover:text-gray-650 dark:hover:text-gray-300'
          }`}
        >
          Configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 text-center ${
            activeTab === 'history'
              ? 'border-brand-500 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-gray-400 hover:text-gray-650 dark:hover:text-gray-300'
          }`}
        >
          Historique
        </button>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 py-1 space-y-5">
        {activeTab === 'config' ? (
          schema === null ? (
            <p className="text-[11px] text-gray-500 italic">
              Aucune configuration pour ce type de nœud.
            </p>
          ) : (
            schema.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                data={selectedNode.data}
                selectedNode={selectedNode}
                nodes={nodes}
                edges={edges}
                automationId={automationId}
                onUpdate={(patch) => updateNodeData(selectedNode.id, patch)}
              />
            ))
          )
        ) : (
          /* History View */
          <div className="space-y-3">
            {!automationId ? (
              <p className="text-[11px] text-gray-500 italic">
                Sauvegardez l'automatisation pour voir l'historique d'exécution.
              </p>
            ) : runsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-brand-500" size={20} />
              </div>
            ) : runs.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">
                Aucune exécution enregistrée pour cette automatisation.
              </p>
            ) : (
              runs.map((run) => {
                const isExpanded = expandedRunId === run.id;
                const summary = run.summary || {};
                const nodeOutput = summary.nodeOutputs?.[selectedNode.id];
                const nodeError = summary.runningNodeErrors?.[selectedNode.id] || (run.status === 'failed' && run.errorMessage ? run.errorMessage : null);
                const wasExecuted = summary.completedNodeIds?.includes(selectedNode.id) || !!nodeOutput || !!nodeError;
                
                return (
                  <div 
                    key={run.id} 
                    className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/30 dark:bg-gray-900/10"
                  >
                    {/* Run Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {run.status === 'completed' && <CheckCircle2 size={13} className="text-emerald-500" />}
                        {run.status === 'failed' && <AlertCircle size={13} className="text-red-500" />}
                        {(run.status === 'running' || run.status === 'queued') && (
                          <Loader2 size={13} className="text-brand-500 animate-spin" />
                        )}
                        <div>
                          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                            {new Date(run.startedAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-[9px] text-gray-450 flex items-center gap-1">
                            <Clock size={10} />
                            {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : '--'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!wasExecuted && (
                          <span className="text-[8px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-medium">
                            Non exécuté
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                    </button>

                    {/* Run Details */}
                    {isExpanded && (
                      <div className="p-3 border-t border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-950 text-[10px] space-y-2.5">
                        {nodeError && (
                          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-750 dark:text-red-400 font-mono text-[9px] leading-relaxed break-words">
                            <div className="font-bold mb-0.5">Erreur du nœud :</div>
                            {String(nodeError)}
                          </div>
                        )}

                        {nodeOutput !== undefined && nodeOutput !== null ? (
                          <div className="space-y-1">
                            <span className="font-bold text-gray-500 dark:text-gray-400">Sortie :</span>
                            <pre className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 font-mono text-[9px] overflow-x-auto max-h-[140px] text-gray-700 dark:text-gray-300">
                              {typeof nodeOutput === 'object' 
                                ? JSON.stringify(nodeOutput, null, 2) 
                                : String(nodeOutput)}
                            </pre>
                          </div>
                        ) : !nodeError ? (
                          <p className="text-gray-450 dark:text-gray-500 italic">
                            Aucune donnée de sortie ou ce nœud n'a pas été atteint.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:bg-transparent dark:border-gray-800 space-y-2">
        {onTestNode && (
          <button
            type="button"
            onClick={() => onTestNode(selectedNode.id)}
            disabled={!automationId}
            title={!automationId ? "Sauvegardez d'abord l'automatisation" : undefined}
            className="w-full py-2 px-4 rounded-xl border border-brand-200 dark:border-brand-900/30 text-brand-650 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap size={13} />
            Tester ce nœud
          </button>
        )}
        <button
          type="button"
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:border-red-350"
        >
          <Trash2 size={14} />
          Supprimer ce nœud
        </button>
      </div>
    </aside>
  );
}

interface FieldRendererProps {
  field: FieldSchema;
  data: any;
  selectedNode: Node;
  nodes: Node[];
  edges: Edge[];
  automationId?: string;
  onUpdate: (patch: any) => void;
}

function FieldRenderer({ field, data, selectedNode, nodes, edges, automationId, onUpdate }: FieldRendererProps) {
  if (field.showWhen && !field.showWhen(data)) return null;

  const value = data?.[field.key] ?? field.defaultValue ?? '';

  if (field.type === 'info') {
    return (
      <div className="bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-xl p-3.5 space-y-2">
        <div className="text-[10px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">
          {field.label}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{field.info}</p>
      </div>
    );
  }

  if (field.type === 'webhook-url') {
    return (
      <div className="bg-emerald-550/5 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5 space-y-2">
        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          {field.label}
        </div>
        <input
          readOnly
          value={`${window.location.origin}/api/automations/webhooks/${automationId || 'workflow_id'}`}
          className="w-full text-[10px] bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-gray-700 dark:text-gray-300 select-all outline-none"
        />
        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
          Envoyez une requête HTTP POST sur cette URL pour déclencher le workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <FieldControl
        field={field}
        value={value}
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        onChange={(next) => onUpdate({ [field.key]: next })}
      />
      {field.description && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
          {field.description}
        </p>
      )}
    </div>
  );
}

interface FieldControlProps {
  field: FieldSchema;
  value: any;
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node;
  onChange: (next: any) => void;
}

function FieldControl({ field, value, nodes, edges, selectedNode, onChange }: FieldControlProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  switch (field.type) {
    case 'text':
    case 'password':
      return (
        <Input
          type={field.type === 'password' ? 'password' : 'text'}
          placeholder={field.placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    case 'select':
      return (
        <select
          className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          {!value && <option value="">—</option>}
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case 'node-ref':
      return (
        <select
          className="w-full text-xs p-2.5 rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Sélectionnez un nœud source…</option>
          {nodes
            .filter((n) => n.id !== selectedNode.id)
            .map((n) => (
              <option key={n.id} value={n.id}>
                {String((n.data as any)?.label || '')} ({n.id})
              </option>
            ))}
        </select>
      );
    case 'textarea': {
      const insertAtCursor = (text: string) => {
        const el = textareaRef.current;
        if (!el) {
          onChange(String(value ?? '') + text);
          return;
        }
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? el.value.length;
        const before = el.value.slice(0, start);
        const after = el.value.slice(end);
        const next = before + text + after;
        onChange(next);
        // Restore caret after the inserted text on next render
        setTimeout(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = start + text.length;
        }, 0);
      };
      return (
        <div className="space-y-1.5">
          <textarea
            ref={textareaRef}
            className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-3 min-h-[90px] outline-none"
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.variablePicker && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-650 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                <Variable size={10} />
                {pickerOpen ? 'Masquer les variables' : 'Insérer une variable'}
              </button>
              {pickerOpen && (
                <VariablePicker
                  node={selectedNode}
                  nodes={nodes}
                  edges={edges}
                  onPick={(insert) => insertAtCursor(insert)}
                />
              )}
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
