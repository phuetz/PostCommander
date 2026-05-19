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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useAutomations, useSaveAutomation, useTriggerAutomation } from '../hooks/useAutomations';

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
      case 'trigger': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400';
      case 'action': return 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400';
      case 'logic': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl border bg-white dark:bg-gray-900 min-w-[200px] backdrop-blur-md transition-all hover:shadow-lg ${data.type === 'trigger' ? 'ring-2 ring-emerald-500/20' : ''}`}>
      {data.type !== 'trigger' && (
        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-900" />
      )}
      
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getTheme()}`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">
            {data.type}
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data.label}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-brand-500 border-2 border-white dark:border-gray-900" />
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

function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 relative">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Boîte à outils</h3>
        <p className="text-xs text-gray-500 mb-4">Glissez les éléments sur la toile.</p>
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
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-700 cursor-grab active:cursor-grabbing transition-colors"
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

  const { data: automationsData, isLoading } = useAutomations();
  const saveMutation = useSaveAutomation();
  const triggerMutation = useTriggerAutomation();
  
  const activeAutomation = automationsData?.data?.[0]; // For now, just work with the first one

  useEffect(() => {
    if (activeAutomation?.flowData) {
      try {
        const parsed = JSON.parse(activeAutomation.flowData);
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.edges) setEdges(parsed.edges);
        // Reset id counter based on existing nodes
        id = Math.max(0, ...parsed.nodes.map((n: Node) => parseInt(n.id.split('_')[1] || '0'))) + 1;
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
      await triggerMutation.mutateAsync(automationId);
      toast.success('Workflow lancé ! Vérifiez les logs côté serveur.', { icon: '🚀' });
    } catch (e) {
      toast.error('Erreur lors du lancement');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full animate-fade-in border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <GitFork size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {activeAutomation?.name || 'Nouvelle Automatisation'}
              </h2>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
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

      <div className="flex-1 flex flex-row w-full h-full" ref={reactFlowWrapper}>
        <Sidebar />
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
            <Controls className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 fill-gray-600 dark:fill-gray-300" />
            <MiniMap 
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" 
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
        {selectedNode && (
          <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto z-10 absolute right-0 top-0 bottom-0 shadow-xl">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-gray-900 dark:text-gray-100">Configuration</h3>
               <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                 <X size={18} />
               </button>
             </div>
             
             <div className="text-sm font-medium text-brand-600 mb-4 flex items-center gap-2">
                {selectedNode.data.iconName ? (() => {
                  const SelectedIcon = iconMap[selectedNode.data.iconName as string] || Zap;
                  return <SelectedIcon size={16} />;
                })() : null}
                {String(selectedNode.data.label || '')}
              </div>
             
             {selectedNode.id.includes('url') && (
               <div className="space-y-4">
                 <Input 
                   label="URL à visiter" 
                   placeholder="https://news.ycombinator.com" 
                   value={String(selectedNode.data.url || '')}
                   onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                 />
                 <p className="text-xs text-gray-500">Stagehand commencera sa navigation ici.</p>
               </div>
             )}
             
             {selectedNode.id.includes('scrape') && (
               <div className="space-y-4">
                 <Input 
                   label="Instruction de Scraping" 
                   placeholder="Extrais les 3 premiers articles (titre et lien)" 
                   value={String(selectedNode.data.instruction || '')}
                   onChange={(e) => updateNodeData(selectedNode.id, { instruction: e.target.value })}
                 />
                 <p className="text-xs text-gray-500">L'IA de Stagehand trouvera seule les bons sélecteurs.</p>
               </div>
             )}
             
             {selectedNode.id.includes('ai') && (
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Prompt IA
                   </label>
                   <textarea
                     className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 min-h-[150px]"
                     placeholder="Résume ces données en un post LinkedIn avec des emojis"
                     value={String(selectedNode.data.prompt || '')}
                     onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                   />
                 </div>
                 <p className="text-xs text-gray-500">Ce prompt transformera le JSON brut extrait par Stagehand.</p>
               </div>
             )}
             
             {selectedNode.id.includes('post') && (
               <div className="space-y-4">
                 <p className="text-sm text-gray-600">Le résultat de l'IA sera sauvegardé comme un brouillon dans PostCommander.</p>
               </div>
             )}
          </aside>
        )}
      </div>
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
