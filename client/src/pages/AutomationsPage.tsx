import { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
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
  X
};

// --- CUSTOM NODE IMPLEMENTATION ---
const nodeTypes = {
  customNode: CustomNode,
};

function CustomNode({ data }: { data: any }) {
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
    <div className={`px-4 py-3.5 shadow-lg rounded-xl border bg-white dark:bg-gray-900 min-w-[210px] backdrop-blur-md transition-all hover:scale-[1.02] duration-200 ${theme.border} ${theme.leftBorder} ${theme.shadow}`}>
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
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-brand-500 border-2 border-white dark:border-gray-900 hover:bg-brand-600" />
    </div>
  );
}

// --- SIDEBAR DRAG ITEMS ---
const AVAILABLE_NODES = [
  { type: 'trigger', id: 'trig-url', label: 'Cibler URL', iconName: 'Globe' },
  { type: 'action', id: 'act-scrape', label: 'Scraper (Stagehand)', iconName: 'Search' },
  { type: 'action', id: 'act-ai', label: 'Traiter (LLM)', iconName: 'Bot' },
  { type: 'action', id: 'act-post', label: 'Créer un Brouillon', iconName: 'PenTool' },
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
};

interface SidebarProps {
  activeTab: 'toolbox' | 'guide';
  setActiveTab: (tab: 'toolbox' | 'guide') => void;
  onLoadTemplate: (templateKey: 'hackerNews' | 'blogRepurpose') => void;
}

function Sidebar({ activeTab, setActiveTab, onLoadTemplate }: SidebarProps) {
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
          Guide & Exemples
        </button>
      </div>

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
                    {AVAILABLE_NODES.filter(n => n.type === groupType).map((node) => {
                      const NodeIcon = iconMap[node.iconName] || Zap;
                      return (
                        <div
                          key={node.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-700 cursor-grab active:cursor-grabbing transition-colors"
                          onDragStart={(event) => onDragStart(event, node)}
                          draggable
                        >
                          <NodeIcon size={16} className={groupType === 'trigger' ? 'text-emerald-500' : groupType === 'action' ? 'text-brand-500' : 'text-amber-500'} />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{node.label}</span>
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
                <Sparkles size={16} className="text-amber-500 animate-pulse" /> Modèles de démarrage
              </h3>
              <p className="text-[11px] text-gray-500 mb-3">Chargez un workflow prêt à l'emploi en 1 clic.</p>
              
              <div className="space-y-2">
                <button
                  onClick={() => onLoadTemplate('hackerNews')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-800/20 hover:border-brand-500 dark:hover:border-brand-500 transition-colors group"
                >
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    Veille Hacker News (Tech)
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Scrape HN, résume les 3 premières actus en un post LinkedIn et crée un brouillon.
                  </div>
                </button>

                <button
                  onClick={() => onLoadTemplate('blogRepurpose')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-800/20 hover:border-brand-500 dark:hover:border-brand-500 transition-colors group"
                >
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    Recyclage de Blog (Blog Repost)
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Extrait le texte d'un blog et le transforme en un thread Twitter/X sauvegardé en brouillon.
                  </div>
                </button>
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
                  <p className="mt-0.5">Glissez le nœud <strong>Cibler URL</strong>. Double-cliquez dessus pour configurer l'URL de départ.</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                    2
                  </span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Extraire</p>
                  <p className="mt-0.5">Glissez <strong>Scraper (Stagehand)</strong>. Décrivez ce que vous voulez (ex: <i>"prends le titre et le lien"</i>).</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                    3
                  </span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Traiter</p>
                  <p className="mt-0.5">Glissez <strong>Traiter (LLM)</strong> et donnez les instructions IA (ex: <i>"rédige un post Linkedin"</i>).</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                    4
                  </span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Enregistrer</p>
                  <p className="mt-0.5">Glissez <strong>Créer un Brouillon</strong> pour enregistrer automatiquement le post généré dans PostCommander.</p>
                </div>

                <div className="relative pl-6">
                  <span className="absolute left-0 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                    5
                  </span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Relier & Lancer</p>
                  <p className="mt-0.5">Reliez les nœuds en faisant glisser le point bleu inférieur vers le point gris supérieur. Sauvegardez et cliquez sur tester !</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

let id = 0;
const getId = (prefix: string) => `${prefix}_${id++}`;

function AutomationsFlow() {
  const { t } = useTranslation();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<'toolbox' | 'guide'>('guide');

  // Execution Modal & Status Poll states
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { data: automationsData, isLoading } = useAutomations();
  const saveMutation = useSaveAutomation();
  const triggerMutation = useTriggerAutomation();
  
  const activeAutomation = automationsData?.data?.[0]; // For now, just work with the first one

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

  const loadTemplate = (templateKey: 'hackerNews' | 'blogRepurpose') => {
    const template = WORKFLOW_TEMPLATES[templateKey];
    setNodes(template.nodes);
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {activeAutomation?.name || 'Nouvelle Automatisation'}
              </h2>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> Actif
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scraping Visuel & IA
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
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLoadTemplate={loadTemplate} />
        
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
                
                {selectedNode.id.includes('ai') && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Prompt de Réécriture IA</span>
                    </div>
                    <textarea
                      className="w-full rounded-xl border border-gray-350 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-xs p-3 min-h-[140px] outline-none"
                      placeholder="Prends le JSON extrait et rédige un post LinkedIn attrayant avec une accroche forte..."
                      value={String(selectedNode.data.prompt || '')}
                      onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                      Ce prompt guidera l'IA pour générer le contenu final à partir des données extraites.
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
              <div className="space-y-4 relative pl-4 border-l border-gray-200 dark:border-gray-800 ml-2">
                {/* Step 1: Init */}
                <div className="relative pl-6">
                  <div className={`absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                    elapsedSeconds >= 6 || jobStatus?.state === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : activeJobId && elapsedSeconds < 6 && jobStatus?.state !== 'failed'
                      ? 'bg-brand-500 border-brand-500 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}>
                    {elapsedSeconds >= 6 || jobStatus?.state === 'completed' ? <Check size={10} /> : "1"}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Initialisation de Stagehand</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Lancement de l'environnement de navigation local headless.</p>
                </div>

                {/* Step 2: Extract */}
                <div className="relative pl-6">
                  <div className={`absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                    elapsedSeconds >= 16 || jobStatus?.state === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : elapsedSeconds >= 6 && elapsedSeconds < 16 && jobStatus?.state !== 'failed'
                      ? 'bg-brand-500 border-brand-500 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}>
                    {elapsedSeconds >= 16 || jobStatus?.state === 'completed' ? <Check size={10} /> : "2"}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Scraping et Extraction</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Navigation vers l'URL et récupération intelligente des données.</p>
                </div>

                {/* Step 3: LLM Rewrite */}
                <div className="relative pl-6">
                  <div className={`absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                    elapsedSeconds >= 24 || jobStatus?.state === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : elapsedSeconds >= 16 && elapsedSeconds < 24 && jobStatus?.state !== 'failed'
                      ? 'bg-brand-500 border-brand-500 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}>
                    {elapsedSeconds >= 24 || jobStatus?.state === 'completed' ? <Check size={10} /> : "3"}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Génération du Post (GPT-4o)</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Application du prompt IA sur les données extraites.</p>
                </div>

                {/* Step 4: Save Draft */}
                <div className="relative pl-6">
                  <div className={`absolute -left-[23px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                    jobStatus?.state === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : elapsedSeconds >= 24 && jobStatus?.state !== 'failed'
                      ? 'bg-brand-500 border-brand-500 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}>
                    {jobStatus?.state === 'completed' ? <Check size={10} /> : "4"}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Sauvegarde dans les Brouillons</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Création automatique d'une fiche post dans PostCommander.</p>
                </div>
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
