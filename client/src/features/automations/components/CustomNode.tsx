import { Handle, Position } from '@xyflow/react';
import { Zap, X } from 'lucide-react';
import { iconMap } from '../constants/icon-map';

interface CustomNodeProps {
  id: string;
  data: any;
  selected?: boolean;
  onDelete?: (id: string) => void;
}

export function CustomNode({ id, data, selected, onDelete }: CustomNodeProps) {
  const Icon = iconMap[data.iconName] || Zap;

  const getTheme = () => {
    switch (data.type) {
      case 'trigger':
        return {
          border: 'border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/40',
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          leftBorder: 'border-l-4 border-l-emerald-500',
          shadow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
          badgeText: 'DÉCLENCHEUR',
        };
      case 'action':
        return {
          border: 'border-brand-500/20 dark:border-brand-500/10 hover:border-brand-500/40',
          bg: 'bg-brand-50 dark:bg-brand-950/20',
          text: 'text-brand-650 dark:text-brand-400',
          leftBorder: 'border-l-4 border-l-brand-500',
          shadow: 'shadow-[0_0_15px_-3px_rgba(139,92,246,0.1)]',
          badgeBg: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
          badgeText: 'ACTION',
        };
      case 'logic':
        return {
          border: 'border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/40',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-600 dark:text-amber-400',
          leftBorder: 'border-l-4 border-l-amber-500',
          shadow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
          badgeText: 'LOGIQUE',
        };
      default:
        return {
          border: 'border-gray-200 dark:border-gray-800 hover:border-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-800/20',
          text: 'text-gray-655 dark:text-gray-400',
          leftBorder: 'border-l-4 border-l-gray-400',
          shadow: '',
          badgeBg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
          badgeText: 'NŒUD',
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`px-4 py-3.5 shadow-lg rounded-xl border bg-white dark:bg-gray-900 min-w-[210px] backdrop-blur-md transition-all hover:scale-[1.02] duration-200 group ${theme.border} ${theme.leftBorder} ${theme.shadow} ${selected ? 'ring-2 ring-brand-500 border-transparent' : ''}`}>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 cursor-pointer"
          title="Supprimer ce nœud"
        >
          <X size={10} />
        </button>
      )}

      {data.type !== 'trigger' && (
        <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-gray-400 border-2 border-white dark:border-gray-900 hover:bg-brand-500" />
      )}

      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme.bg} ${theme.text}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${theme.badgeBg}`}>
              {theme.badgeText}
            </span>
          </div>
          <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
            {data.label}
          </div>
          {(() => {
            let previewText = '';
            if (data.rssUrl) previewText = `RSS: ${data.rssUrl}`;
            else if (data.url) previewText = data.url;
            else if (data.interval) previewText = `Toutes les ${data.interval} min`;
            else if (data.instruction) previewText = data.instruction;
            else if (data.loopOver) previewText = `Sur: ${data.loopOver}`;
            else if (data.fileName) previewText = `${data.fileType?.toUpperCase() || 'CSV'} : ${data.fileName}`;
            else if (data.conditionField) previewText = `${data.conditionField} ${data.conditionOperator === 'gt' ? '>' : data.conditionOperator === 'lt' ? '<' : '=='} ${data.conditionValue}`;
            else if (data.delaySeconds) previewText = `${data.delaySeconds} secondes`;
            else if (data.imagePrompt) previewText = `Image: ${data.imagePrompt}`;
            else if (data.hookStyle) previewText = `Style: ${data.hookStyle}`;
            else if (data.targetTone) previewText = `Ton: ${data.targetTone}`;
            else if (data.prompt && data.type === 'action') previewText = data.prompt;

            if (!previewText) return null;
            return (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-[150px] font-medium italic">
                {previewText}
              </div>
            );
          })()}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-brand-500 border-2 border-white dark:border-gray-900 hover:bg-brand-600" />
    </div>
  );
}

export const nodeTypes = {
  customNode: CustomNode,
};
