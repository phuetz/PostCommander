import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Play, Save, Undo2, Redo2, Sparkles, Trash2,
  AlignVerticalSpaceAround, History, X, Zap,
} from 'lucide-react';
import { iconMap } from '../constants/icon-map';
import { AVAILABLE_NODES } from '../constants/available-nodes';
import { WORKFLOW_TEMPLATES } from '../constants/workflow-templates';

interface PaletteItem {
  id: string;
  group: 'Nœuds' | 'Modèles' | 'Actions';
  label: string;
  hint?: string;
  iconName?: string;
  IconComp?: React.ComponentType<any>;
  iconColor?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  // Action callbacks (all optional — the palette only shows enabled actions)
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAutoLayout?: () => void;
  onClear?: () => void;
  onOpenHistory?: () => void;
  onTrigger?: () => void;
  onInsertNode: (nodeData: { id: string; label: string; iconName: string; type: string }) => void;
  onLoadTemplate: (templateKey: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CommandPalette({
  open,
  onClose,
  onSave,
  onUndo,
  onRedo,
  onAutoLayout,
  onClear,
  onOpenHistory,
  onTrigger,
  onInsertNode,
  onLoadTemplate,
  canUndo,
  canRedo,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when opened/closed
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items: PaletteItem[] = useMemo(() => {
    const result: PaletteItem[] = [];

    // Nodes
    for (const node of AVAILABLE_NODES) {
      result.push({
        id: `node:${node.id}`,
        group: 'Nœuds',
        label: node.label,
        hint: `Insérer un nœud ${node.type}`,
        iconName: node.iconName,
        onSelect: () => onInsertNode(node),
      });
    }

    // Templates
    for (const [key, tpl] of Object.entries(WORKFLOW_TEMPLATES)) {
      result.push({
        id: `template:${key}`,
        group: 'Modèles',
        label: tpl.name,
        hint: `Charger ce modèle (${tpl.nodes.length} nœuds)`,
        IconComp: Sparkles,
        iconColor: 'text-amber-500',
        onSelect: () => onLoadTemplate(key),
      });
    }

    // Actions
    if (onTrigger) {
      result.push({
        id: 'action:trigger',
        group: 'Actions',
        label: 'Tester le workflow',
        hint: 'Lancer une exécution',
        IconComp: Play,
        iconColor: 'text-emerald-500',
        onSelect: onTrigger,
      });
    }
    if (onSave) {
      result.push({
        id: 'action:save',
        group: 'Actions',
        label: 'Sauvegarder',
        hint: 'Cmd+S',
        IconComp: Save,
        iconColor: 'text-brand-500',
        onSelect: onSave,
      });
    }
    if (onUndo && canUndo) {
      result.push({
        id: 'action:undo',
        group: 'Actions',
        label: 'Annuler',
        hint: 'Cmd+Z',
        IconComp: Undo2,
        iconColor: 'text-gray-500',
        onSelect: onUndo,
      });
    }
    if (onRedo && canRedo) {
      result.push({
        id: 'action:redo',
        group: 'Actions',
        label: 'Rétablir',
        hint: 'Cmd+Shift+Z',
        IconComp: Redo2,
        iconColor: 'text-gray-500',
        onSelect: onRedo,
      });
    }
    if (onAutoLayout) {
      result.push({
        id: 'action:auto-layout',
        group: 'Actions',
        label: 'Organiser le canevas',
        hint: 'Auto-layout vertical',
        IconComp: AlignVerticalSpaceAround,
        iconColor: 'text-purple-500',
        onSelect: onAutoLayout,
      });
    }
    if (onOpenHistory) {
      result.push({
        id: 'action:history',
        group: 'Actions',
        label: "Historique d'exécution",
        hint: 'Voir les runs passés',
        IconComp: History,
        iconColor: 'text-gray-500',
        onSelect: onOpenHistory,
      });
    }
    if (onClear) {
      result.push({
        id: 'action:clear',
        group: 'Actions',
        label: 'Effacer le canevas',
        hint: 'Supprimer tous les nœuds',
        IconComp: Trash2,
        iconColor: 'text-red-500',
        onSelect: onClear,
      });
    }

    return result;
  }, [onTrigger, onSave, onUndo, onRedo, onAutoLayout, onOpenHistory, onClear, onInsertNode, onLoadTemplate, canUndo, canRedo]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        (item.hint ?? '').toLowerCase().includes(q),
    );
  }, [items, query]);

  // Reset activeIndex if filtered list shrinks past it
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [activeIndex, filtered.length]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) {
        item.onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  if (!open) return null;

  // Group by section for rendering
  const grouped: Record<string, PaletteItem[]> = {};
  filtered.forEach((item) => {
    (grouped[item.group] ||= []).push(item);
  });

  let renderedIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tapez une commande, un nœud ou un modèle…"
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group}>
              <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {group}
              </div>
              {groupItems.map((item) => {
                const idx = renderedIdx++;
                const isActive = idx === activeIndex;
                const Icon = item.IconComp ?? (item.iconName ? iconMap[item.iconName] : null) ?? Zap;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      item.onSelect();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-850'
                    }`}
                  >
                    <Icon size={13} className={item.iconColor ?? (item.group === 'Nœuds' ? 'text-brand-500' : 'text-gray-500')} />
                    <span className="flex-1 text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">{item.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-500">Aucun résultat pour "{query}"</div>
          )}
        </div>

        <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center gap-3 text-[9px] text-gray-400">
          <span>↑↓ naviguer</span>
          <span>⏎ valider</span>
          <span>esc fermer</span>
        </div>
      </div>
    </div>
  );
}
