import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useTranslation } from 'react-i18next';
import {
  Play,
  Zap,
  Target,
  Send,
  GitFork,
  Clock,
  Bot,
  Save,
  CheckCircle2,
  Globe,
  Search,
  PenTool,
  X,
  HelpCircle,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  Trash2,
  Database,
  FileText,
  Compass,
  Share2,
  Rss,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAutomations, useSaveAutomation, useTriggerAutomation, useAutomationJob } from '../hooks/useAutomations';

// --- ICON MAPPING FOR SERIALIZATION ---
const iconMap: Record<string, React.ComponentType<any>> = {
  Play,
  Zap,
  Target,
  Send,
  GitFork,
  Clock,
  Bot,
  Save,
  CheckCircle2,
  Globe,
  Search,
  PenTool,
  X,
  ExternalLink,
  BookOpen,
  Database,
  FileText,
  Compass,
  Share2,
  Rss,
  Image,
};

function CustomNode({ id, data, selected, onDelete }: { id: string; data: any; selected?: boolean; onDelete?: (id: string) => void }) {
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

// --- SIDEBAR DRAG ITEMS ---
const AVAILABLE_NODES = [
  // Triggers
  { type: 'trigger', id: 'trig-url', label: 'Cibler URL', iconName: 'Globe' },
  { type: 'trigger', id: 'trig-rss', label: 'Flux RSS', iconName: 'Rss' },
  { type: 'trigger', id: 'trig-cron', label: 'Planificateur (Cron)', iconName: 'Clock' },
  { type: 'trigger', id: 'trig-webhook', label: 'Webhook HTTP', iconName: 'Zap' },
  
  // Actions
  { type: 'action', id: 'act-scrape', label: 'Scraper (Stagehand)', iconName: 'Search' },
  { type: 'action', id: 'act-search', label: 'Recherche Web (Tavily)', iconName: 'Compass' },
  { type: 'action', id: 'act-http', label: 'Requête HTTP API', iconName: 'ExternalLink' },
  { type: 'action', id: 'act-file', label: 'Parseur de Fichier', iconName: 'BookOpen' },
  { type: 'action', id: 'act-format', label: 'Formateur de Texte', iconName: 'FileText' },
  { type: 'action', id: 'act-ai', label: 'Traiter (LLM)', iconName: 'Bot' },
  { type: 'action', id: 'act-hook', label: 'Générateur d\'accroches', iconName: 'Sparkles' },
  { type: 'action', id: 'act-tone', label: 'Ajusteur de ton', iconName: 'PenTool' },
  { type: 'action', id: 'act-image', label: 'Générateur d\'Image', iconName: 'Image' },
  { type: 'action', id: 'act-db', label: 'Enregistrer en Base', iconName: 'Database' },
  { type: 'action', id: 'act-publish', label: 'Publier sur Blog/CMS', iconName: 'Share2' },
  { type: 'action', id: 'act-post', label: 'Créer un Brouillon', iconName: 'PenTool' },
  
  // Logic
  { type: 'logic', id: 'log-loop', label: 'Boucle Pour-Chaque', iconName: 'Bot' },
  { type: 'logic', id: 'log-condition', label: 'Condition (Si/Sinon)', iconName: 'GitFork' },
  { type: 'logic', id: 'log-delay', label: 'Délai (Attendre)', iconName: 'Clock' },
];

// --- 1-CLICK TEMPLATES DEFINITION ---
const WORKFLOW_TEMPLATES = {
  hackerNews: {
    name: 'Veille Hacker News (Tech)',
    nodes: [
      {
        id: 'trig-url_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Cibler URL', type: 'trigger', iconName: 'Globe', url: 'https://news.ycombinator.com', instruction: '', prompt: '' },
      },
      {
        id: 'act-scrape_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Scraper (Stagehand)', type: 'action', iconName: 'Search', url: '', instruction: 'Extract the top 3 news articles and their URLs', prompt: '' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Traiter (LLM)', type: 'action', iconName: 'Bot', url: '', instruction: '', prompt: 'Summarize these top 3 tech stories in a short, punchy LinkedIn post. Add a hook, key takeaways, and relevant hashtags.' },
      },
      {
        id: 'act-post_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool', url: '', instruction: '', prompt: '' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-url_0', target: 'act-scrape_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-scrape_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-post_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  blogRepurpose: {
    name: 'Extraction de Blog / Repost',
    nodes: [
      {
        id: 'trig-url_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Cibler URL', type: 'trigger', iconName: 'Globe', url: 'https://patricehuetz.fr', instruction: '', prompt: '' },
      },
      {
        id: 'act-scrape_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Scraper (Stagehand)', type: 'action', iconName: 'Search', url: '', instruction: 'Extract the main article content, title, and key sections from the page', prompt: '' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Traiter (LLM)', type: 'action', iconName: 'Bot', url: '', instruction: '', prompt: 'Based on this article, generate an engaging thread of 4 tweets summarizing the core message. End with a strong call to action.' },
      },
      {
        id: 'act-post_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool', url: '', instruction: '', prompt: '' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-url_0', target: 'act-scrape_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-scrape_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-post_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  loopTechNews: {
    name: 'Boucle Multi-Articles (HN)',
    nodes: [
      {
        id: 'trig-url_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Cibler URL', type: 'trigger', iconName: 'Globe', url: 'https://news.ycombinator.com', instruction: '', prompt: '' },
      },
      {
        id: 'act-scrape_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Scraper (Stagehand)', type: 'action', iconName: 'Search', url: '', instruction: 'Extract the top 5 articles with titles and links', prompt: '' },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-scrape_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Sparkles', prompt: 'Write a dedicated, insightful tweet discussing this specific news article: Title: {{item.title}} (Link: {{item.link}}).' },
      },
      {
        id: 'act-post_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-url_0', target: 'act-scrape_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-scrape_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-post_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  csvImportGenerator: {
    name: 'Import CSV & Rédaction',
    nodes: [
      {
        id: 'trig-cron_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Planificateur (Cron)', type: 'trigger', iconName: 'Clock', interval: 60 },
      },
      {
        id: 'act-file_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Parseur de Fichier', type: 'action', iconName: 'BookOpen', fileType: 'csv', fileName: 'ideas.csv' },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-file_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Sparkles', prompt: 'Create an expert post on Agile/Product development using this raw idea from the CSV: "{{item.idea}}". Tone: professional and inspiring.' },
      },
      {
        id: 'act-post_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-cron_0', target: 'act-file_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-file_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-post_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  webhookApiIntegration: {
    name: 'Intégration API & Webhook',
    nodes: [
      {
        id: 'trig-webhook_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Webhook HTTP', type: 'trigger', iconName: 'Zap' },
      },
      {
        id: 'act-http_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Requête HTTP API', type: 'action', iconName: 'ExternalLink', method: 'GET', url: 'https://dev.to/api/articles?username=patricehuetz', headers: 'Accept: application/json' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Traiter (LLM)', type: 'action', iconName: 'Bot', prompt: 'Here is the latest published article on Dev.to: Title: {{act-http_1.response.0.title}}. Write a summary update for LinkedIn.' },
      },
      {
        id: 'act-post_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-webhook_0', target: 'act-http_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-http_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-post_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  tavilySearchAlert: {
    name: 'Veille & Recherche Web Tavily',
    nodes: [
      {
        id: 'trig-cron_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Planificateur (Cron)', type: 'trigger', iconName: 'Clock', interval: 1440 },
      },
      {
        id: 'act-search_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Recherche Web (Tavily)', type: 'action', iconName: 'Compass', searchQuery: 'dernieres actualites IA agents autonomes', maxResults: 3 },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-search_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Create an analysis LinkedIn post on this news: Title: {{item.title}}\nContent: {{item.content}}' },
      },
      {
        id: 'act-db_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Enregistrer en Base', type: 'action', iconName: 'Database', dbAction: 'save_post' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-cron_0', target: 'act-search_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-search_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-db_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  autoBloggingCMS: {
    name: 'Veille & Publication CMS',
    nodes: [
      {
        id: 'trig-webhook_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Webhook HTTP', type: 'trigger', iconName: 'Zap' },
      },
      {
        id: 'act-search_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Recherche Web (Tavily)', type: 'action', iconName: 'Compass', searchQuery: 'Agile Product Management trends 2026', maxResults: 1 },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Based on this news, write a comprehensive article for a tech blog: {{act-search_1.0.content}}' },
      },
      {
        id: 'act-format_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Formateur de Texte', type: 'action', iconName: 'FileText', textTemplate: 'Article rédigé le {{current_date}}.\nSource: {{act-search_1.0.url}}\n\nContenu:\n{{act-ai_2}}' },
      },
      {
        id: 'act-publish_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Publier sur Blog/CMS', type: 'action', iconName: 'Share2', publishUrl: 'https://patricehuetz.fr/api/publish', publishToken: 'Bearer Secret_Token_123' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-webhook_0', target: 'act-search_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-search_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-format_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-format_3', target: 'act-publish_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  rssToLinkedIn: {
    name: 'Veille RSS & Rédaction Multi-Réseaux',
    nodes: [
      {
        id: 'trig-rss_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Flux RSS', type: 'trigger', iconName: 'Rss', rssUrl: 'https://news.ycombinator.com/rss' },
      },
      {
        id: 'log-loop_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'trig-rss_0' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Create an engaging educational post about this article: Title: {{item.title}}\nDescription: {{item.description}}' },
      },
      {
        id: 'act-image_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: "Générateur d'Image", type: 'action', iconName: 'Image', imagePrompt: 'A futuristic tech illustration representing: {{item.title}}' },
      },
      {
        id: 'act-post_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-rss_0', target: 'log-loop_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'log-loop_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-image_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-image_3', target: 'act-post_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  toneOptimizer: {
    name: 'Rédaction & Optimisation du Ton',
    nodes: [
      {
        id: 'trig-cron_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Planificateur (Cron)', type: 'trigger', iconName: 'Clock', interval: 1440 },
      },
      {
        id: 'act-search_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Recherche Web (Tavily)', type: 'action', iconName: 'Compass', searchQuery: 'Agile development trends 2026', maxResults: 2 },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-search_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Summarize the core message of this news: {{item.title}}\nContent: {{item.content}}' },
      },
      {
        id: 'act-tone_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Ajusteur de ton', type: 'action', iconName: 'PenTool', targetTone: 'professional' },
      },
      {
        id: 'act-post_5',
        type: 'customNode',
        position: { x: 250, y: 700 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-cron_0', target: 'act-search_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-search_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-tone_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-4-5', source: 'act-tone_4', target: 'act-post_5', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
};

interface SidebarProps {
  activeTab: 'toolbox' | 'guide' | 'chat';
  setActiveTab: (tab: 'toolbox' | 'guide' | 'chat') => void;
  onLoadTemplate: (templateKey: keyof typeof WORKFLOW_TEMPLATES) => void;
  nodes: Node[];
  edges: Edge[];
  onWorkflowUpdated: (nodes: Node[], edges: Edge[]) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: Array<{
    text?: string;
    toolCalls?: Array<{
      name: string;
      args: any;
    }>;
  }>;
}

function ChatPanel({
  nodes,
  edges,
  onWorkflowUpdated,
}: {
  nodes: Node[];
  edges: Edge[];
  onWorkflowUpdated: (nodes: Node[], edges: Edge[]) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        "Bonjour ! Je suis votre assistant de création de workflows. Décrivez le processus que vous voulez automatiser (ex: \"Crée un workflow qui va sur Hacker News, prend les 3 premiers articles, puis fait un résumé par IA et crée un brouillon\"), et je vais construire le diagramme pour vous !",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isSending) return;

    if (!textToSend) {
      setInput('');
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setLoadingStep('Analyse de la demande...');

    const stepTimer = setTimeout(() => {
      setLoadingStep('Conception du workflow...');
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Mise à jour des connexions...');
    }, 5500);

    try {
      const serverMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.post('/automations/agent/build', {
        messages: serverMessages,
        currentState: { nodes, edges },
      });

      const { text: replyText, workflow, steps } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyText || "J'ai mis à jour le workflow sur le canevas.",
          steps,
        },
      ]);

      if (workflow && Array.isArray(workflow.nodes)) {
        onWorkflowUpdated(workflow.nodes, workflow.edges || []);
        toast.success("Workflow mis à jour par l'IA !", {
          icon: '✨',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to run agent builder:', error);
      toast.error('Erreur lors de la mise à jour du workflow.');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "Désolé, j'ai rencontré une erreur en essayant de construire ce workflow. Veuillez vérifier vos clés d'API dans les réglages.",
        },
      ]);
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      setIsSending(false);
      setLoadingStep('');
    }
  };

  const suggestions = [
    { text: 'Veille automatique Hacker News et post LinkedIn', label: 'Veille HN' },
    { text: 'Scraper un site web et faire un résumé de blog', label: 'Scrape & Résume' },
    { text: 'Créer une boucle sur les résultats d\'une recherche Tavily', label: 'Recherche + Boucle' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      {/* Scrollable messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed transition-all duration-200 ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-none font-medium'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider text-brand-500">
                  <Sparkles size={10} className="animate-pulse" />
                  Assistant PC
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.steps && m.steps.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700/60 space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span>Traces de l'Agent</span>
                    <span className="px-1.5 py-0.2 bg-brand-500/10 text-brand-500 rounded-full text-[9px] lowercase font-normal">
                      {m.steps.length} {m.steps.length > 1 ? 'étapes' : 'étape'}
                    </span>
                  </div>
                  <div className="space-y-2 pl-1.5 border-l border-brand-500/30 ml-1">
                    {m.steps.map((step, sIdx) => {
                      const toolCalls = step.toolCalls || [];
                      return (
                        <div key={sIdx} className="text-[10px] text-gray-500 dark:text-gray-400 relative pl-3.5 py-0.5">
                          <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-brand-500 border border-white dark:border-gray-900"></span>
                          {step.text && <div className="font-medium text-gray-700 dark:text-gray-300 mb-0.5">{step.text}</div>}
                          {toolCalls.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {toolCalls.map((tc, tcIdx) => {
                                let toolLabel = tc.name;
                                let icon = <Bot size={9} className="text-brand-500" />;
                                if (tc.name === 'searchWeb') {
                                  toolLabel = `Recherche : "${tc.args?.query || ''}"`;
                                  icon = <Search size={9} className="text-teal-500" />;
                                } else if (tc.name === 'scrapeUrlPreview') {
                                  toolLabel = `Analyse : ${tc.args?.url || ''}`;
                                  icon = <Globe size={9} className="text-blue-500" />;
                                } else if (tc.name === 'setWorkflowState') {
                                  toolLabel = `Configuration (${tc.args?.nodes?.length || 0} nœuds)`;
                                  icon = <Zap size={9} className="text-amber-500 animate-pulse" />;
                                } else if (tc.name === 'getWorkflowState') {
                                  toolLabel = `Lecture diagramme`;
                                  icon = <Sparkles size={9} className="text-purple-500" />;
                                }
                                return (
                                  <div
                                    key={tcIdx}
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700/80 rounded text-[9px] text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                                    title={toolLabel}
                                  >
                                    {icon}
                                    <span className="font-medium text-[9px] max-w-[120px] truncate">
                                      {toolLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs border border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-brand-500">
                <Loader2 size={10} className="animate-spin text-brand-500" />
                <span>{loadingStep || 'IA en cours de réflexion...'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-0"></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion tags (only if there are no user messages yet) */}
      {messages.length === 1 && !isSending && (
        <div className="px-4 py-2 space-y-1.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((s, idx) => (
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

      {/* Fixed input bar */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Décrivez votre workflow..."
          disabled={isSending}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          className="flex-1 text-xs py-2 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-850 hover:border-gray-300 focus:border-brand-500 rounded-lg"
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || isSending}
          className="p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 text-white shrink-0 shadow-sm"
        >
          <Send size={14} />
        </Button>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, onLoadTemplate, nodes, edges, onWorkflowUpdated }: SidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full z-10 relative shrink-0">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <button
          onClick={() => setActiveTab('toolbox')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
            activeTab === 'toolbox'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Outils
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
            activeTab === 'guide'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Guide
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === 'chat'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Sparkles size={11} className={activeTab === 'chat' ? 'text-brand-500 animate-pulse' : ''} />
          Chat IA
        </button>
      </div>

      {activeTab === 'chat' ? (
        <ChatPanel nodes={nodes} edges={edges} onWorkflowUpdated={onWorkflowUpdated} />
      ) : (
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'toolbox' ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Boîte à outils</h3>
                <p className="text-xs text-gray-500 mb-4">Glissez les éléments sur le canevas.</p>
              </div>

              <div className="space-y-4">
                {['trigger', 'logic', 'action'].map((groupType) => (
                  <div key={groupType}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      {groupType === 'trigger' ? 'Déclencheurs' : groupType === 'action' ? 'Actions' : 'Logique'}
                    </h4>
                    <div className="space-y-2">
                      {AVAILABLE_NODES.filter((n) => n.type === groupType).map((node) => {
                        const NodeIcon = iconMap[node.iconName] || Zap;
                        return (
                          <div
                            key={node.id}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-700 cursor-grab active:cursor-grabbing transition-colors"
                            onDragStart={(event) => onDragStart(event, node)}
                            draggable
                          >
                            <NodeIcon
                              size={16}
                              className={
                                groupType === 'trigger'
                                  ? 'text-emerald-500'
                                  : groupType === 'action'
                                    ? 'text-brand-500'
                                    : 'text-amber-500'
                              }
                            />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {node.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1-Click Templates */}
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500 animate-pulse" /> Bibliothèque de Modèles
                </h3>
                <p className="text-[11px] text-gray-500 mb-4">Chargez un workflow prêt à l'emploi en 1 clic.</p>

                <div className="space-y-4">
                  {/* Catégorie : Curation & Veille */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      Curation & Veille
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('rssToLinkedIn')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                          Veille RSS Multi-Réseaux
                          <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-mono font-bold">RSS</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Surveille un flux RSS, boucle sur chaque article pour rédiger par IA, génère une image et crée un brouillon.
                        </div>
                      </button>

                      <button
                        onClick={() => onLoadTemplate('hackerNews')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Veille Hacker News (Tech)
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Scrape HN, résume les 3 premières actus en un post LinkedIn et crée un brouillon.
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Catégorie : Recyclage de Contenu */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-650 dark:text-brand-400 mb-2">
                      Recyclage & Génération
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('blogRepurpose')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/10 dark:hover:bg-brand-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          Recyclage de Blog (Blog Repost)
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Extrait le contenu d'un blog et le transforme en un thread Twitter/X sauvegardé en brouillon.
                        </div>
                      </button>

                      <button
                        onClick={() => onLoadTemplate('csvImportGenerator')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/10 dark:hover:bg-brand-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center gap-1.5">
                          Génération en Lot (CSV)
                          <span className="text-[8px] bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 px-1 py-0.2 rounded font-mono font-bold">CSV</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Lit un fichier CSV d'idées brutes et boucle sur chaque ligne pour rédiger du contenu.
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Catégorie : Intelligence & Analyse */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                      Analyse & Optimisation
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('tavilySearchAlert')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-650 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                          Recherche Web Tavily
                          <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-450 px-1 py-0.2 rounded font-mono font-bold">Tavily</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Recherche sur le web par Tavily, puis boucle sur les résultats pour rédiger des analyses en base.
                        </div>
                      </button>

                      <button
                        onClick={() => onLoadTemplate('toneOptimizer')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-650 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                          Optimisation de Ton IA
                          <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-450 px-1 py-0.2 rounded font-mono font-bold">Ton</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Recherche et rédige des posts par IA, puis utilise l'ajusteur de ton pour affiner le style avant enregistrement.
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Catégorie : Intégrations Techniques */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-650 dark:text-purple-400 mb-2">
                      Intégrations & Dev
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onLoadTemplate('webhookApiIntegration')}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/10 dark:hover:bg-purple-950/10 transition-all group"
                      >
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1.5">
                          Intégration API & Webhook
                          <span className="text-[8px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1 py-0.2 rounded font-mono font-bold">API</span>
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          Attend un webhook HTTP, interroge une API externe via HTTP GET, puis génère une synthèse LinkedIn.
                        </div>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-800" />

              {/* Guided Help */}
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
                  <BookOpen size={16} className="text-brand-500" /> Guide de construction
                </h3>
                <div className="space-y-4 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      1
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Cibler</p>
                    <p className="mt-0.5">
                      Glissez le nœud <strong>Cibler URL</strong>. Double-cliquez dessus pour configurer l'URL de
                      départ.
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      2
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Extraire</p>
                    <p className="mt-0.5">
                      Glissez <strong>Scraper (Stagehand)</strong>. Décrivez ce que vous voulez (ex: <i>"prends le
                      titre et le lien"</i>).
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      3
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Traiter</p>
                    <p className="mt-0.5">
                      Glissez <strong>Traiter (LLM)</strong> et donnez les instructions IA (ex: <i>"rédige un post
                      Linkedin"</i>).
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      4
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Enregistrer</p>
                    <p className="mt-0.5">
                      Glissez <strong>Créer un Brouillon</strong> pour enregistrer automatiquement le post généré
                      dans PostCommander.
                    </p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      5
                    </span>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Relier & Lancer</p>
                    <p className="mt-0.5">
                      Reliez les nœuds en faisant glisser le point bleu inférieur vers le point gris supérieur.
                      Sauvegardez et cliquez sur tester !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

let id = 0;
const getId = (prefix: string) => `${prefix}_${id++}`;

function AutomationsFlow() {
  const { t } = useTranslation();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<'toolbox' | 'guide' | 'chat'>('guide');

  // Execution Modal & Status Poll states
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { data: automationsData, isLoading } = useAutomations();
  const saveMutation = useSaveAutomation();
  const triggerMutation = useTriggerAutomation();

  const executionOrder = useMemo(() => {
    const triggerNodes = nodes.filter((n) => n.data?.type === 'trigger');
    const visited = new Set<string>();
    const order: Node[] = [];

    const adj: Record<string, string[]> = {};
    for (const edge of edges) {
      if (!adj[edge.source]) adj[edge.source] = [];
      adj[edge.source].push(edge.target);
    }

    const queue = [...triggerNodes.map(t => t.id)];
    triggerNodes.forEach(t => visited.add(t.id));

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = nodes.find((n) => n.id === currentId);
      if (node) {
        order.push(node);
      }
      const targets = adj[currentId] || [];
      for (const targetId of targets) {
        if (!visited.has(targetId)) {
          visited.add(targetId);
          queue.push(targetId);
        }
      }
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        order.push(node);
      }
    }

    return order;
  }, [nodes, edges]);
  
  const activeAutomation = automationsData?.data?.[0]; // For now, just work with the first one

  const handleWorkflowUpdated = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Job query definition
  const { data: jobStatus } = useAutomationJob(activeJobId);

  // Poll elapsed time
  useEffect(() => {
    let interval: any;
    if (activeJobId && (jobStatus?.state === 'active' || jobStatus?.state === 'waiting' || !jobStatus?.state)) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (jobStatus?.state === 'completed' || jobStatus?.state === 'failed') {
      clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeJobId, jobStatus?.state]);

  // Load existing workflow
  useEffect(() => {
    if (activeAutomation?.flowData) {
      try {
        const parsed = JSON.parse(activeAutomation.flowData);
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.edges) setEdges(parsed.edges);
        // Reset id counter based on existing nodes
        id = Math.max(0, ...parsed.nodes.map((n: Node) => {
          const parts = n.id.split('_');
          return parseInt(parts[parts.length - 1] || '0');
        })) + 1;
      } catch (e) {
        console.error("Failed to parse flowData", e);
      }
    }
  }, [activeAutomation?.flowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeDataStr = event.dataTransfer.getData('application/reactflow');

      if (!nodeDataStr) return;

      const nodeData = JSON.parse(nodeDataStr);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(nodeData.id),
        type: 'customNode',
        position,
        data: { label: nodeData.label, type: nodeData.type, iconName: nodeData.iconName, url: '', instruction: '', prompt: '' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const updatedNode = { ...n, data: { ...n.data, ...newData } };
          if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
          return updatedNode;
        }
        return n;
      })
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    toast.success("Nœud supprimé");
  };

  const handleSave = async () => {
    if (!reactFlowInstance) return;
    const flowData = JSON.stringify({ nodes, edges });
    try {
      await saveMutation.mutateAsync({
        id: activeAutomation?.id,
        name: activeAutomation?.name || 'My Scraper Automation',
        status: 'draft',
        flowData,
      });
      toast.success('Automatisation sauvegardée avec succès !');
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleTrigger = async () => {
    // First save
    await handleSave();
    
    if (!activeAutomation?.id && !saveMutation.data?.data?.id) {
       toast.error("Veuillez sauvegarder avant de lancer.");
       return;
    }
    
    const automationId = activeAutomation?.id || saveMutation.data?.data?.id;

    if (!automationId) {
      toast.error("Identifiant de l'automatisation manquant.");
      return;
    }

    try {
      setIsRunModalOpen(true);
      setActiveJobId(null);
      setElapsedSeconds(0);
      
      const res = await triggerMutation.mutateAsync(automationId);
      if (res?.jobId) {
        setActiveJobId(res.jobId);
      } else {
        throw new Error('Aucun identifiant de tâche reçu');
      }
    } catch (e) {
      toast.error('Erreur lors du lancement');
      setIsRunModalOpen(false);
    }
  };

  const loadTemplate = (templateKey: keyof typeof WORKFLOW_TEMPLATES) => {
    const template = WORKFLOW_TEMPLATES[templateKey];
    setNodes(template.nodes as any);
    setEdges(template.edges);
    setSelectedNode(null);
    setActiveTab('toolbox'); // switch tab to toolbox so they see their nodes controls
    
    // Reset internal auto-increment ID helper base
    id = Math.max(0, ...template.nodes.map((n: Node) => {
      const parts = n.id.split('_');
      return parseInt(parts[parts.length - 1] || '0');
    })) + 1;

    toast.success(`Modèle "${template.name}" chargé avec succès !`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full animate-fade-in border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <GitFork size={22} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900 dark:text-gray-150">
              {activeAutomation?.name || "Éditeur d'automatisation"}
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Concevez des flux d'extraction et de traitement IA de bout en bout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleSave} loading={saveMutation.isPending} icon={<Save size={16} />}>
            Sauvegarder
          </Button>
          <Button onClick={handleTrigger} loading={triggerMutation.isPending} icon={<Play size={16} className="fill-current" />}>
            Tester le Workflow
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-row w-full h-full relative" ref={reactFlowWrapper}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoadTemplate={loadTemplate}
          nodes={nodes}
          edges={edges}
          onWorkflowUpdated={handleWorkflowUpdated}
        />
        
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50/50 dark:bg-gray-900/50"
          >
            <Background color="#9ca3af" gap={16} size={1} />
            <Controls className="bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-850 fill-gray-600 dark:fill-gray-300" />
            <MiniMap 
              className="bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-850" 
              maskColor="rgba(0,0,0,0.1)"
              nodeColor={(n) => {
                if (n.data?.type === 'trigger') return '#10b981';
                if (n.data?.type === 'logic') return '#f59e0b';
                return '#8b5cf6';
              }}
            />
          </ReactFlow>
        </div>
        
        {/* Node Properties Sidebar */}
        {selectedNode && (() => {
          const nodeType = selectedNode.data.type || 'action';
          let themeLabel = 'Action';
          let themeBgColor = 'bg-brand-50 dark:bg-brand-900/20';
          let themeTextColor = 'text-brand-650 dark:text-brand-400';
          let badgeBg = 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400';

          if (nodeType === 'trigger') {
            themeLabel = 'Déclencheur';
            themeBgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
            themeTextColor = 'text-emerald-600 dark:text-emerald-400';
            badgeBg = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
          } else if (nodeType === 'logic') {
            themeLabel = 'Logique';
            themeBgColor = 'bg-amber-50 dark:bg-amber-900/20';
            themeTextColor = 'text-amber-600 dark:text-amber-400';
            badgeBg = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
          }

          const SelectedIcon = selectedNode.data.iconName ? (iconMap[selectedNode.data.iconName as string] || Zap) : Zap;

          return (
            <aside className="w-80 bg-white/95 dark:bg-gray-900/95 border-l border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-5 overflow-y-auto z-10 absolute right-0 top-0 bottom-0 shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${badgeBg} inline-block mb-1`}>
                    {themeLabel}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 ${themeBgColor} ${themeTextColor}`}>
                      <SelectedIcon size={14} />
                    </div>
                    {String(selectedNode.data.label || '')}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              {/* Form Content */}
              <div className="flex-1 space-y-5">
                {selectedNode.id.includes('url') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Globe size={13} className="text-emerald-500" />
                      <span>URL à visiter</span>
                    </div>
                    <Input 
                      placeholder="https://news.ycombinator.com" 
                      value={String(selectedNode.data.url || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      L'adresse de départ du scraper (Stagehand).
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('cron') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Clock size={13} className="text-emerald-500" />
                      <span>Intervalle (Minutes)</span>
                    </div>
                    <Input 
                      type="number"
                      placeholder="60" 
                      value={String(selectedNode.data.interval || '60')}
                      onChange={(e) => updateNodeData(selectedNode.id, { interval: Number(e.target.value) })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Fréquence d'exécution automatique du workflow en minutes.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('webhook') && (
                  <div className="bg-emerald-550/5 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      <Zap size={13} className="text-emerald-500" />
                      <span>URL de Webhook</span>
                    </div>
                    <input 
                      readOnly 
                      value={`http://localhost:3003/api/automations/webhooks/${activeAutomation?.id || 'workflow_id'}`} 
                      className="w-full text-[10px] bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-gray-700 dark:text-gray-300 select-all outline-none"
                    />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                      Envoyez une requête HTTP POST sur cette URL pour déclencher le workflow. Le corps de la requête est stocké dans le contexte.
                    </p>
                  </div>
                )}
                
                {selectedNode.id.includes('scrape') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Search size={13} className="text-brand-500" />
                      <span>Instruction de Scraping</span>
                    </div>
                    <textarea
                      className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-3 min-h-[90px] outline-none"
                      placeholder="Extrais les 3 premiers articles (titre et lien)"
                      value={String(selectedNode.data.instruction || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { instruction: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Décrivez en langage naturel les informations à extraire. L'agent IA comprendra de manière intelligente.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('http') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <ExternalLink size={13} className="text-brand-500" />
                        <span>Configuration HTTP</span>
                      </div>
                      <select 
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500"
                        value={String(selectedNode.data.method || 'GET')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { method: e.target.value })}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">URL API</label>
                      <Input 
                        placeholder="https://api.github.com/..." 
                        value={String(selectedNode.data.url || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Headers (Clé: Valeur)</label>
                      <textarea 
                        className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs p-2 min-h-[60px] outline-none"
                        placeholder="Content-Type: application/json&#10;Authorization: Bearer KEY"
                        value={String(selectedNode.data.headers || '')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { headers: e.target.value })}
                      />
                    </div>
                    {String(selectedNode.data.method) !== 'GET' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Corps de la requête (JSON)</label>
                        <textarea 
                          className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs p-2 min-h-[65px] outline-none font-mono"
                          placeholder='{ "key": "value" }'
                          value={String(selectedNode.data.body || '')} 
                          onChange={(e) => updateNodeData(selectedNode.id, { body: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.id.includes('file') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <BookOpen size={13} className="text-brand-500" />
                        <span>Fichier Source</span>
                      </div>
                      <select 
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                        value={String(selectedNode.data.fileType || 'csv')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { fileType: e.target.value })}
                      >
                        <option value="csv">CSV (Tableur)</option>
                        <option value="json">JSON</option>
                        <option value="pdf">PDF (Texte brut)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nom du fichier</label>
                      <Input 
                        placeholder="ideas.csv" 
                        value={String(selectedNode.data.fileName || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { fileName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.id.includes('search') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Compass size={13} className="text-brand-500" />
                        <span>Recherche Tavily</span>
                      </div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Requête de recherche</label>
                      <Input 
                        placeholder="e.g. dernières actualités IA en France" 
                        value={String(selectedNode.data.searchQuery || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { searchQuery: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Résultats max (1-10)</label>
                      <Input 
                        type="number"
                        min={1}
                        max={10}
                        value={String(selectedNode.data.maxResults || '3')}
                        onChange={(e) => updateNodeData(selectedNode.id, { maxResults: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.id.includes('format') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <FileText size={13} className="text-brand-500" />
                      <span>Formateur de Texte</span>
                    </div>
                    <textarea
                      className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-3 min-h-[140px] outline-none"
                      placeholder="Sujet: {{item.idea}}&#10;Thème: {{item.topic}}&#10;Rédige à partir de cela..."
                      value={String(selectedNode.data.textTemplate || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { textTemplate: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Formatez ou fusionnez des variables sans appeler l'IA. Utilisez la notation double accolade.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('db') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Database size={13} className="text-brand-500" />
                      <span>Enregistrer en Base</span>
                    </div>
                    <select 
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                      value={String(selectedNode.data.dbAction || 'save_post')} 
                      onChange={(e) => updateNodeData(selectedNode.id, { dbAction: e.target.value })}
                    >
                      <option value="save_post">Créer un brouillon de post (LinkedIn)</option>
                      <option value="log_event">Loguer un événement d'automatisation</option>
                    </select>
                  </div>
                )}

                {selectedNode.id.includes('publish') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Share2 size={13} className="text-brand-500" />
                        <span>Publication Blog/CMS</span>
                      </div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">URL API de publication</label>
                      <Input 
                        placeholder="https://patricehuetz.fr/api/publish" 
                        value={String(selectedNode.data.publishUrl || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { publishUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Jeton d'autorisation (Token)</label>
                      <Input 
                        type="password"
                        placeholder="Bearer/Secret Token" 
                        value={String(selectedNode.data.publishToken || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { publishToken: e.target.value })}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Envoie une requête POST contenant le titre de l'élément en cours et le contenu rédigé final.
                    </p>
                  </div>
                )}
                
                {selectedNode.id.includes('ai') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Configuration LLM & Prompt</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Fournisseur</label>
                        <select 
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-1.5 outline-none"
                          value={String(selectedNode.data.provider || 'openai')}
                          onChange={(e) => updateNodeData(selectedNode.id, { provider: e.target.value })}
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="google">Google Gemini</option>
                          <option value="mistral">Mistral AI</option>
                          <option value="ollama">Ollama</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Modèle</label>
                        <input 
                          type="text"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-1.5 outline-none"
                          placeholder="e.g. gpt-4o-mini"
                          value={String(selectedNode.data.model || 'gpt-4o-mini')}
                          onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                        />
                      </div>
                    </div>

                    <textarea
                      className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-3 min-h-[140px] outline-none"
                      placeholder="Prends le JSON extrait et rédige un post LinkedIn attrayant avec une accroche forte..."
                      value={String(selectedNode.data.prompt || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Utilisez <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">&#123;&#123;item.champ&#125;&#125;</code> pour référencer la ligne courante d'une boucle ou les données parentes.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('loop') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Bot size={13} className="text-amber-500" />
                        <span>Boucle Pour-Chaque</span>
                      </div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Variable Source</label>
                      <select 
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-500"
                        value={String(selectedNode.data.loopOver || '')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { loopOver: e.target.value })}
                      >
                        <option value="">Sélectionnez un nœud source...</option>
                        {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                          <option key={n.id} value={n.id}>
                            {String(n.data?.label || '')} ({n.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Exécute tous les nœuds enfants connectés pour chaque élément du tableau renvoyé par ce nœud parent.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('condition') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <GitFork size={13} className="text-amber-500" />
                        <span>Condition Logique</span>
                      </div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Variable à tester</label>
                      <Input 
                        placeholder="item.likes" 
                        value={String(selectedNode.data.conditionField || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { conditionField: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Opérateur</label>
                      <select 
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                        value={String(selectedNode.data.conditionOperator || 'gt')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { conditionOperator: e.target.value })}
                      >
                        <option value="gt">Supérieur à (&gt;)</option>
                        <option value="lt">Inférieur à (&lt;)</option>
                        <option value="eq">Égal à (==)</option>
                        <option value="contains">Contient</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Valeur de comparaison</label>
                      <Input 
                        placeholder="10" 
                        value={String(selectedNode.data.conditionValue || '')}
                        onChange={(e) => updateNodeData(selectedNode.id, { conditionValue: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {selectedNode.id.includes('rss') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Rss size={13} className="text-emerald-500" />
                      <span>Flux RSS</span>
                    </div>
                    <Input 
                      placeholder="https://news.ycombinator.com/rss" 
                      value={String(selectedNode.data.rssUrl || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { rssUrl: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      L'URL XML du flux RSS à surveiller de manière automatique.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('image') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Image size={13} className="text-brand-500" />
                      <span>Prompt de Génération d'Image</span>
                    </div>
                    <textarea
                      className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-3 min-h-[90px] outline-none"
                      placeholder="Description visuelle de l'image (ex: Un astronaute sur Mars, style cyberpunk)"
                      value={String(selectedNode.data.imagePrompt || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { imagePrompt: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Entrez la description de l'illustration à associer à votre post. Vous pouvez injecter des variables du type <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">&#123;&#123;item.title&#125;&#125;</code>.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('hook') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Sparkles size={13} className="text-brand-500" />
                        <span>Style d'accroches</span>
                      </div>
                      <select 
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                        value={String(selectedNode.data.hookStyle || 'viral')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { hookStyle: e.target.value })}
                      >
                        <option value="viral">Viral & Court (Ats/LinkedIn)</option>
                        <option value="question">Question Intrigante</option>
                        <option value="story">Storytelling (Anecdote)</option>
                        <option value="stats">Statistique choc</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      L'IA générera 3 propositions d'accroches conformes au style sélectionné pour captiver l'attention de vos lecteurs.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('tone') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <PenTool size={13} className="text-brand-500" />
                        <span>Ton Cible</span>
                      </div>
                      <select 
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                        value={String(selectedNode.data.targetTone || 'professional')} 
                        onChange={(e) => updateNodeData(selectedNode.id, { targetTone: e.target.value })}
                      >
                        <option value="professional">Professionnel & Expert</option>
                        <option value="casual">Décontracté & Amical</option>
                        <option value="assertive">Direct & Assertif</option>
                        <option value="humorous">Humoristique & Satirique</option>
                        <option value="analytical">Analytique & Structuré</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Réécrit le post rédigé précédemment pour adopter précisément ce ton.
                    </p>
                  </div>
                )}

                {selectedNode.id.includes('delay') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Clock size={13} className="text-amber-500" />
                      <span>Délai d'attente</span>
                    </div>
                    <Input 
                      type="number"
                      placeholder="60" 
                      value={String(selectedNode.data.delaySeconds || '60')}
                      onChange={(e) => updateNodeData(selectedNode.id, { delaySeconds: Number(e.target.value) })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Durée de temporisation en secondes avant de passer à l'étape suivante.
                    </p>
                  </div>
                )}
                
                {selectedNode.id.includes('post') && (
                  <div className="bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">
                      <Save size={13} />
                      <span>Action Finale</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Le texte final généré par le nœud IA sera automatiquement sauvegardé en tant que brouillon dans votre section **Brouillons**.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions - Delete Button */}
              <div className="pt-4 border-t border-gray-100 dark:bg-transparent dark:border-gray-800">
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
        })()}
      </div>

      {/* Dynamic Workflow Execution Progress Modal */}
      {isRunModalOpen && (
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
                  onClick={() => {
                    setIsRunModalOpen(false);
                    setActiveJobId(null);
                  }} 
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
                {(() => {
                  const progress = jobStatus?.progress as {
                    activeNodeId?: string | null;
                    completedNodeIds?: string[];
                    runningNodeErrors?: Record<string, string>;
                  } | undefined;

                  const activeNodeId = progress?.activeNodeId;
                  const completedNodeIds = progress?.completedNodeIds || [];
                  const runningNodeErrors = progress?.runningNodeErrors || {};

                  return executionOrder.map((node, index) => {
                    const isCompleted = completedNodeIds.includes(node.id) || jobStatus?.state === 'completed';
                    const isActive = activeNodeId === node.id || (index === 0 && !activeNodeId && jobStatus?.state === 'active');
                    const errorMsg = runningNodeErrors[node.id] || (isActive && jobStatus?.state === 'failed' ? jobStatus?.failedReason : null);
                    const isFailed = !!errorMsg;

                    let nodeIcon = "⚙️";
                    if (node.data?.type === 'trigger') nodeIcon = "⚡";
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
                  });
                })()}
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

              {/* Close Button / Bottom Actions */}
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-850 mt-4">
                <Button
                  variant="secondary"
                  disabled={!!(activeJobId && jobStatus?.state !== 'completed' && jobStatus?.state !== 'failed')}
                  onClick={() => {
                    setIsRunModalOpen(false);
                    setActiveJobId(null);
                  }}
                >
                  Fermer
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AutomationsPage() {
  return (
    <ReactFlowProvider>
      <AutomationsFlow />
    </ReactFlowProvider>
  );
}
