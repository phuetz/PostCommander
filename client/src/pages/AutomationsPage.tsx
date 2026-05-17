import { useState, useCallback, useRef } from 'react';
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
  MessageCircle,
  Zap,
  Target,
  Send,
  GitFork,
  Clock,
  Bot,
  UserPlus,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// --- CUSTOM NODE IMPLEMENTATION ---
const nodeTypes = {
  customNode: CustomNode,
};

function CustomNode({ data }: { data: any }) {
  const Icon = data.icon || Zap;
  
  // Theme colors based on type
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
      {/* Input Handle (Not for triggers) */}
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
      
      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-brand-500 border-2 border-white dark:border-gray-900" />
    </div>
  );
}

// --- SIDEBAR DRAG ITEMS ---
const AVAILABLE_NODES = [
  { type: 'trigger', id: 'trig-comment', label: 'Nouveau Commentaire', icon: MessageCircle },
  { type: 'trigger', id: 'trig-follow', label: 'Nouvel Abonné', icon: UserPlus },
  { type: 'action', id: 'act-score', label: 'Qualifier le Lead (IA)', icon: Target },
  { type: 'action', id: 'act-reply', label: 'Répondre (IA)', icon: Bot },
  { type: 'action', id: 'act-dm', label: 'Envoyer DM', icon: Send },
  { type: 'logic', id: 'log-condition', label: 'Condition (Si/Sinon)', icon: GitFork },
  { type: 'logic', id: 'log-delay', label: 'Délai (Attendre)', icon: Clock },
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
        <p className="text-xs text-gray-500 mb-4">Glissez les éléments sur la toile pour créer votre automatisation.</p>
      </div>

      <div className="space-y-4">
        {/* Group by type */}
        {['trigger', 'logic', 'action'].map((groupType) => (
          <div key={groupType}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {groupType === 'trigger' ? 'Déclencheurs' : groupType === 'action' ? 'Actions' : 'Logique'}
            </h4>
            <div className="space-y-2">
              {AVAILABLE_NODES.filter(n => n.type === groupType).map((node) => (
                <div
                  key={node.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-700 cursor-grab active:cursor-grabbing transition-colors"
                  onDragStart={(event) => onDragStart(event, node)}
                  draggable
                >
                  <node.icon size={16} className={groupType === 'trigger' ? 'text-emerald-500' : groupType === 'action' ? 'text-brand-500' : 'text-amber-500'} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{node.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// --- MAIN CANVAS COMPONENT ---
let id = 0;
const getId = () => `dndnode_${id++}`;

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'customNode',
    position: { x: 250, y: 50 },
    data: { label: 'Nouveau Commentaire', type: 'trigger', icon: MessageCircle },
  },
];

function AutomationsFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

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
        id: getId(),
        type: 'customNode',
        position,
        data: { label: nodeData.label, type: nodeData.type, icon: nodeData.icon },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  return (
    <div className="flex flex-row h-full w-full" ref={reactFlowWrapper}>
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
    </div>
  );
}

// --- PAGE WRAPPER ---
export function AutomationsPage() {
  const { t } = useTranslation();

  const handleSave = () => {
    toast.success('Automatisation sauvegardée avec succès !');
  };

  const handlePublish = () => {
    toast.success('Automatisation activée en production !', { icon: '🚀' });
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
                Lead Nurturing Automatique
              </h2>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> Actif
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Éditeur visuel de Workflow (Drag & Drop)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleSave} icon={<Save size={16} />}>
            Brouillon
          </Button>
          <Button onClick={handlePublish} icon={<Play size={16} className="fill-current" />}>
            Publier le Workflow
          </Button>
        </div>
      </div>

      {/* ReactFlow Editor */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <AutomationsFlow />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
