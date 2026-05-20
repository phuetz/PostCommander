import type { Node, Edge } from '@xyflow/react';

export type AutomationTab = 'toolbox' | 'guide' | 'chat';

export type NodeKind = 'trigger' | 'action' | 'logic';

export interface AvailableNode {
  type: NodeKind;
  id: string;
  label: string;
  iconName: string;
}

export interface WorkflowTemplate {
  name: string;
  nodes: Node[];
  edges: Edge[];
}

export interface AgentStepToolCall {
  name: string;
  args: any;
}

export interface AgentStep {
  text?: string;
  toolCalls?: AgentStepToolCall[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: AgentStep[];
}

export interface JobProgress {
  activeNodeId?: string | null;
  completedNodeIds?: string[];
  runningNodeErrors?: Record<string, string>;
}

export interface SidebarProps {
  activeTab: AutomationTab;
  setActiveTab: (tab: AutomationTab) => void;
  onLoadTemplate: (templateKey: string) => void;
  nodes: Node[];
  edges: Edge[];
  onWorkflowUpdated: (nodes: Node[], edges: Edge[]) => void;
  automationId: string | undefined;
  onAutomationCreated?: (id: string) => void;
  chatSessionId: string | null;
  onChatSessionChange: (id: string | null) => void;
}
