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
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Play, GitFork, Save, Undo2, Redo2, History, Power, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useAutomations, useSaveAutomation, useTriggerAutomation, useAutomationJob } from '../hooks/useAutomations';

import { Sidebar } from '../features/automations/components/Sidebar';
import { NodeInspector } from '../features/automations/components/NodeInspector';
import { RunModal } from '../features/automations/components/RunModal';
import { CommandPalette } from '../features/automations/components/CommandPalette';
import { ValidationBanner } from '../features/automations/components/ValidationBanner';
import { ExecutionHistoryPanel } from '../features/automations/components/ExecutionHistoryPanel';
import { useTestNode } from '../features/automations/hooks/useAutomationRuns';
import { nodeTypes } from '../features/automations/components/CustomNode';
import { WORKFLOW_TEMPLATES } from '../features/automations/constants/workflow-templates';
import { useWorkflowHistory } from '../features/automations/hooks/useWorkflowHistory';
import { useKeyboardShortcuts } from '../features/automations/hooks/useKeyboardShortcuts';
import { validateWorkflow } from '../features/automations/utils/validate-workflow';
import { autoLayout } from '../features/automations/utils/auto-layout';
import { getPreviewState } from '../features/automations/utils/apply-mutation';
import { useChatStream } from '../features/automations/hooks/useChatStream';
import type { AutomationTab } from '../features/automations/types';

let nodeIdCounter = 0;
const getId = (prefix: string) => `${prefix}_${nodeIdCounter++}`;

function AutomationsFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<AutomationTab>('guide');

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // When the chat auto-creates a draft automation, this overrides the [0] picker
  // so the new draft is the "current" automation for save/trigger/webhook URL.
  const [overrideAutomationId, setOverrideAutomationId] = useState<string | null>(null);
  // Lifted from ChatPanel so it survives tab switches (Outils ↔ Chat IA).
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  // Undo/redo history
  const history = useWorkflowHistory();
  const testNodeMutation = useTestNode();
  const stream = useChatStream();

  const { data: automationsData } = useAutomations();
  const saveMutation = useSaveAutomation();
  const triggerMutation = useTriggerAutomation();

  const { previewNodes, previewEdges } = useMemo(() => {
    if (stream.pendingMutations.length > 0) {
      const preview = getPreviewState(nodes, edges, stream.pendingMutations);
      return { previewNodes: preview.nodes, previewEdges: preview.edges };
    }
    return { previewNodes: nodes, previewEdges: edges };
  }, [nodes, edges, stream.pendingMutations]);

  const executionOrder = useMemo(() => {
    const triggerNodes = nodes.filter((n) => (n.data as any)?.type === 'trigger');
    const visited = new Set<string>();
    const order: Node[] = [];

    const adj: Record<string, string[]> = {};
    for (const edge of edges) {
      if (!adj[edge.source]) adj[edge.source] = [];
      adj[edge.source].push(edge.target);
    }

    const queue = [...triggerNodes.map((t) => t.id)];
    triggerNodes.forEach((t) => visited.add(t.id));

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = nodes.find((n) => n.id === currentId);
      if (node) order.push(node);
      const targets = adj[currentId] || [];
      for (const targetId of targets) {
        if (!visited.has(targetId)) {
          visited.add(targetId);
          queue.push(targetId);
        }
      }
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) order.push(node);
    }

    return order;
  }, [nodes, edges]);

  const activeAutomation =
    (overrideAutomationId
      ? automationsData?.data?.find((a) => a.id === overrideAutomationId)
      : undefined) ?? automationsData?.data?.[0];

  const handleWorkflowUpdated = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      history.push({ nodes, edges });
      setNodes(newNodes);
      setEdges(newEdges);
    },
    [setNodes, setEdges, history, nodes, edges],
  );

  const { data: jobStatus } = useAutomationJob(activeJobId);

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

  useEffect(() => {
    if (activeAutomation?.flowData) {
      try {
        const parsed = JSON.parse(activeAutomation.flowData);
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.edges) setEdges(parsed.edges);
        nodeIdCounter = Math.max(
          0,
          ...parsed.nodes.map((n: Node) => {
            const parts = n.id.split('_');
            return parseInt(parts[parts.length - 1] || '0');
          }),
        ) + 1;
      } catch (e) {
        console.error('Failed to parse flowData', e);
      }
    }
  }, [activeAutomation?.flowData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      history.push({ nodes, edges });
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds));
    },
    [setEdges, history, nodes, edges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const insertNodeAt = useCallback(
    (nodeData: { id: string; label: string; iconName: string; type: string }, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: getId(nodeData.id),
        type: 'customNode',
        position,
        data: { label: nodeData.label, type: nodeData.type, iconName: nodeData.iconName, url: '', instruction: '', prompt: '' },
      };
      history.push({ nodes, edges });
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, history, nodes, edges],
  );

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

      insertNodeAt(nodeData, position);
    },
    [reactFlowInstance, insertNodeAt],
  );

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onNodeDragStop = useCallback(
    () => history.push({ nodes, edges }),
    [history, nodes, edges],
  );

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const updatedNode = { ...n, data: { ...n.data, ...newData } };
          if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
          return updatedNode;
        }
        return n;
      }),
    );
  };

  const deleteNode = (nodeId: string) => {
    history.push({ nodes, edges });
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    toast.success('Nœud supprimé');
  };

  const handleUndo = useCallback(() => {
    const prev = history.undo({ nodes, edges });
    if (!prev) {
      toast('Rien à annuler', { icon: '↩' });
      return;
    }
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setSelectedNode(null);
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const next = history.redo({ nodes, edges });
    if (!next) {
      toast('Rien à rétablir', { icon: '↪' });
      return;
    }
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNode(null);
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNode) deleteNode(selectedNode.id);
  }, [selectedNode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearCanvas = useCallback(() => {
    history.push({ nodes, edges });
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    toast.success('Canevas effacé');
  }, [history, nodes, edges, setNodes, setEdges]);

  const handleToggleChat = useCallback(() => {
    setActiveTab((t) => (t === 'chat' ? 'toolbox' : 'chat'));
  }, []);

  const handleTestNode = useCallback(
    async (nodeId: string) => {
      if (!activeAutomation?.id) {
        toast.error("Sauvegardez d'abord l'automatisation.");
        return;
      }
      try {
        // Save current canvas first so the worker reads the latest flowData.
        await handleSave();
        const res = await testNodeMutation.mutateAsync({
          automationId: activeAutomation.id,
          nodeId,
        });
        setActiveJobId(res.jobId);
        setIsRunModalOpen(true);
        setElapsedSeconds(0);
      } catch (e: any) {
        toast.error(`Erreur lors du test : ${e.message ?? 'inconnue'}`);
      }
    },
    [activeAutomation?.id, testNodeMutation],  // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    history.push({ nodes, edges });
    const next = autoLayout(nodes, edges);
    setNodes(next);
    toast.success('Canevas réorganisé');
  }, [history, nodes, edges, setNodes]);

  const validationIssues = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);

  const handleSelectIssueNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        reactFlowInstance?.fitView({ nodes: [{ id: node.id }] as any, duration: 250 });
      }
    },
    [nodes, reactFlowInstance],
  );

  const handleSave = async (statusOverride?: 'draft' | 'active') => {
    if (!reactFlowInstance) return;
    const flowData = JSON.stringify({ nodes, edges });
    const targetStatus = statusOverride || activeAutomation?.status || 'draft';
    try {
      await saveMutation.mutateAsync({
        id: activeAutomation?.id,
        name: activeAutomation?.name || 'My Scraper Automation',
        status: targetStatus,
        flowData,
      });
      toast.success(
        statusOverride
          ? `Flux ${statusOverride === 'active' ? 'activé' : 'désactivé'} et sauvegardé !`
          : 'Automatisation sauvegardée avec succès !'
      );
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleTrigger = async () => {
    await handleSave();

    if (!activeAutomation?.id && !saveMutation.data?.data?.id) {
      toast.error('Veuillez sauvegarder avant de lancer.');
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

  const loadTemplate = (templateKey: string) => {
    const template = WORKFLOW_TEMPLATES[templateKey];
    if (!template) return;
    history.push({ nodes, edges });
    setNodes(template.nodes as any);
    setEdges(template.edges);
    setSelectedNode(null);
    setActiveTab('toolbox');

    nodeIdCounter = Math.max(
      0,
      ...template.nodes.map((n: Node) => {
        const parts = n.id.split('_');
        return parseInt(parts[parts.length - 1] || '0');
      }),
    ) + 1;

    toast.success(`Modèle "${template.name}" chargé avec succès !`);
  };

  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: handleDeleteSelected,
    onCommandPalette: () => setPaletteOpen((v) => !v),
    onToggleChat: handleToggleChat,
  });

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
              <h1 className="font-bold text-sm text-gray-900 dark:text-gray-150">
                {activeAutomation?.name || "Éditeur d'automatisation"}
              </h1>
              {activeAutomation && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${
                  activeAutomation.status === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                    : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700/50'
                }`}>
                  {activeAutomation.status === 'active' ? (
                    <>
                      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-ping inline-block absolute" />
                      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 inline-block relative" />
                      Actif
                    </>
                  ) : (
                    'Brouillon'
                  )}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Concevez des flux d'extraction et de traitement IA de bout en bout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!history.canUndo}
            title="Annuler (Cmd+Z)"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!history.canRedo}
            title="Rétablir (Cmd+Shift+Z)"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => setHistoryPanelOpen(true)}
            title="Historique d'exécution"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
          >
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            title="Palette de commandes (Cmd+K)"
            className="px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            ⌘K
          </button>
          {activeAutomation && (
            <Button
              variant="ghost"
              className={
                activeAutomation.status === 'active'
                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30'
                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30'
              }
              onClick={() => handleSave(activeAutomation.status === 'active' ? 'draft' : 'active')}
              loading={saveMutation.isPending}
              icon={activeAutomation.status === 'active' ? <Power size={16} /> : <Activity size={16} />}
            >
              {activeAutomation.status === 'active' ? 'Désactiver' : 'Activer le flux'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => handleSave()} loading={saveMutation.isPending} icon={<Save size={16} />}>
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
          automationId={activeAutomation?.id}
          onAutomationCreated={setOverrideAutomationId}
          chatSessionId={chatSessionId}
          onChatSessionChange={setChatSessionId}
          selectedNodeId={selectedNode?.id}
          stream={stream}
        />

        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={previewNodes}
            edges={previewEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50/50 dark:bg-gray-900/50"
          >
            <Background 
              variant={BackgroundVariant.Dots}
              color="rgb(99, 102, 241)" 
              gap={24} 
              size={1.5} 
              style={{ opacity: 0.15 }}
            />
            <Controls className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-850/50 rounded-xl overflow-hidden shadow-md" />
            <MiniMap
              style={{ borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.08)' }}
              className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-850/50 shadow-md"
              maskColor="rgba(99, 102, 241, 0.05)"
              nodeColor={(n) => {
                if ((n.data as any)?.type === 'trigger') return '#10b981';
                if ((n.data as any)?.type === 'logic') return '#f59e0b';
                return '#8b5cf6';
              }}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeInspector
            selectedNode={selectedNode}
            nodes={nodes}
            edges={edges}
            automationId={activeAutomation?.id}
            updateNodeData={updateNodeData}
            deleteNode={deleteNode}
            onClose={() => setSelectedNode(null)}
            onTestNode={handleTestNode}
          />
        )}

        <ValidationBanner issues={validationIssues} onSelectNode={handleSelectIssueNode} />
      </div>

      <RunModal
        isOpen={isRunModalOpen}
        onClose={() => {
          setIsRunModalOpen(false);
          setActiveJobId(null);
        }}
        executionOrder={executionOrder}
        activeJobId={activeJobId}
        jobStatus={jobStatus}
        elapsedSeconds={elapsedSeconds}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClearCanvas}
        onTrigger={handleTrigger}
        onAutoLayout={handleAutoLayout}
        onOpenHistory={() => setHistoryPanelOpen(true)}
        onInsertNode={(nodeData) =>
          insertNodeAt(nodeData, { x: 250, y: 50 + nodes.length * 130 })
        }
        onLoadTemplate={loadTemplate}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />

      <ExecutionHistoryPanel
        open={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
        automationId={activeAutomation?.id}
        onReplay={handleTrigger}
      />
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
