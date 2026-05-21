import { useState } from 'react';
import { Handle, Position, useReactFlow, type Node, type Edge } from '@xyflow/react';
import { Zap, X } from 'lucide-react';
import { iconMap } from '../constants/icon-map';

interface CustomNodeProps {
  id: string;
  data: any;
  selected?: boolean;
  onDelete?: (id: string) => void;
}

const INSERTABLE_NODES = [
  { type: 'action', id: 'act-ai', label: 'Traiter (LLM)', iconName: 'Bot' },
  { type: 'action', id: 'act-scrape', label: 'Scraper (Stagehand)', iconName: 'Search' },
  { type: 'action', id: 'act-search', label: 'Recherche Web (Tavily)', iconName: 'Compass' },
  { type: 'action', id: 'act-format', label: 'Formateur de Texte', iconName: 'FileText' },
  { type: 'action', id: 'act-hook', label: "Générateur d'accroches", iconName: 'Sparkles' },
  { type: 'action', id: 'act-tone', label: 'Ajusteur de ton', iconName: 'PenTool' },
  { type: 'action', id: 'act-image', label: "Générateur d'Image", iconName: 'Image' },
  { type: 'action', id: 'act-db', label: 'Enregistrer en Base', iconName: 'Database' },
  { type: 'action', id: 'act-publish', label: 'Publier sur CMS', iconName: 'Share2' },
  { type: 'action', id: 'act-post', label: 'Créer un Brouillon', iconName: 'PenTool' },
  { type: 'action', id: 'act-jsonpath', label: 'Extracteur JSON (JMESPath)', iconName: 'Braces' },
  { type: 'action', id: 'act-filter', label: 'Filtrer & Trier', iconName: 'Filter' },
  { type: 'logic', id: 'log-batch', label: 'Batch / Map (Parallèle)', iconName: 'List' },
  { type: 'logic', id: 'log-loop', label: 'Boucle Pour-Chaque', iconName: 'Bot' },
  { type: 'logic', id: 'log-condition', label: 'Condition (Si/Sinon)', iconName: 'GitFork' },
  { type: 'logic', id: 'log-delay', label: 'Délai (Attendre)', iconName: 'Clock' },
];

export function CustomNode({ id, data, selected, onDelete }: CustomNodeProps) {
  const Icon = iconMap[data.iconName] || Zap;
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const { getNodes, setNodes, setEdges } = useReactFlow();

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

  const handleAddNode = (nodeTypeId: string, label: string, iconName: string, type: string) => {
    const currentNodes = getNodes();
    
    // Find node ID counter dynamically by parsing existing node IDs
    const maxId = Math.max(
      0,
      ...currentNodes.map((n) => {
        const parts = n.id.split('_');
        return parseInt(parts[parts.length - 1] || '0');
      })
    );
    
    const newId = `${nodeTypeId}_${maxId + 1}`;
    
    // Position new node downstream
    const currentNode = currentNodes.find((n) => n.id === id);
    const position = currentNode 
      ? { x: currentNode.position.x, y: currentNode.position.y + 140 }
      : { x: 250, y: 250 };

    const newNode: Node = {
      id: newId,
      type: 'customNode',
      position,
      data: {
        label,
        type,
        iconName,
        url: '',
        instruction: '',
        prompt: '',
      },
    };

    const newEdge: Edge = {
      id: `edge_${id}_to_${newId}`,
      source: id,
      target: newId,
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
  };

  const previewBorder = data.previewStatus === 'add'
    ? 'border-emerald-500 dark:border-emerald-500 ring-4 ring-emerald-500/25 bg-emerald-50/10 dark:bg-emerald-950/10 animate-pulse'
    : data.previewStatus === 'delete'
    ? 'border-red-500 dark:border-red-500 border-dashed opacity-50 grayscale scale-95 ring-4 ring-red-500/10 bg-red-500/5'
    : data.previewStatus === 'update'
    ? 'border-amber-500 dark:border-amber-500 ring-4 ring-amber-500/25 bg-amber-50/10 dark:bg-amber-950/10 animate-pulse'
    : '';

  return (
    <div 
      onMouseLeave={() => setIsAddMenuOpen(false)}
      className={`px-4 py-3.5 shadow-lg rounded-xl border bg-white dark:bg-gray-900 min-w-[210px] backdrop-blur-md transition-all hover:scale-[1.02] duration-200 group ${previewBorder || `${theme.border} ${theme.leftBorder} ${theme.shadow}`} ${selected && !previewBorder ? 'ring-2 ring-brand-500 border-transparent' : ''}`}
    >
      {onDelete && !data.previewStatus && (
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
            {data.previewStatus && (
              <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded leading-none shrink-0 ${
                data.previewStatus === 'add'
                  ? 'bg-emerald-500 text-white'
                  : data.previewStatus === 'delete'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {data.previewStatus === 'add' ? '+ NOUVEAU' : data.previewStatus === 'delete' ? '- SUPPRIMER' : '• MODIFIÉ'}
              </span>
            )}
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
      
      {/* Floating Downstream Node Quick Insert button */}
      {selected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAddMenuOpen(!isAddMenuOpen);
            }}
            className="w-5 h-5 rounded-full bg-brand-500 hover:bg-brand-650 text-white flex items-center justify-center shadow-md hover:scale-110 transition-all cursor-pointer border border-white dark:border-gray-900"
            title="Ajouter un nœud suivant"
          >
            <span className="text-[14px] font-extrabold leading-none">+</span>
          </button>
          
          {isAddMenuOpen && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1.5 min-w-[180px] z-50 text-left max-h-[220px] overflow-y-auto">
              <div className="px-2.5 py-1 text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-gray-800 mb-1">
                Insérer une étape après
              </div>
              {INSERTABLE_NODES.map((opt) => {
                const OptIcon = iconMap[opt.iconName] || Zap;
                return (
                  <button
                    key={opt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNode(opt.id, opt.label, opt.iconName, opt.type);
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <OptIcon size={12} className="text-gray-400" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const nodeTypes = {
  customNode: CustomNode,
};
