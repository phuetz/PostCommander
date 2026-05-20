import type { Node, Edge } from '@xyflow/react';
import type { WorkflowMutation } from '../hooks/useChatStream';

const EDGE_STYLE = { stroke: '#8b5cf6', strokeWidth: 2 } as const;

export function applyMutations(
  nodes: Node[],
  edges: Edge[],
  mutations: WorkflowMutation[],
): { nodes: Node[]; edges: Edge[] } {
  let nextNodes = [...nodes];
  let nextEdges = [...edges];

  for (const m of mutations) {
    switch (m.kind) {
      case 'add':
        if (!nextNodes.find((n) => n.id === m.node.id)) {
          nextNodes.push(m.node as Node);
        }
        break;
      case 'update':
        nextNodes = nextNodes.map((n) =>
          n.id === m.id ? { ...n, data: { ...n.data, ...m.patch } } : n,
        );
        break;
      case 'delete':
        nextNodes = nextNodes.filter((n) => n.id !== m.id);
        nextEdges = nextEdges.filter((e) => e.source !== m.id && e.target !== m.id);
        break;
      case 'connect': {
        const id = m.edgeId || `e-${m.source}-${m.target}`;
        if (!nextEdges.find((e) => e.id === id)) {
          nextEdges.push({
            id,
            source: m.source,
            target: m.target,
            animated: true,
            style: { ...EDGE_STYLE },
          });
        }
        break;
      }
      case 'disconnect':
        nextEdges = nextEdges.filter(
          (e) => !(e.source === m.source && e.target === m.target),
        );
        break;
    }
  }

  return { nodes: nextNodes, edges: nextEdges };
}

/**
 * Human-friendly description for a single mutation. Used in the diff preview.
 */
export function describeMutation(m: WorkflowMutation): string {
  switch (m.kind) {
    case 'add':
      return `Ajouter "${m.node?.data?.label ?? m.node?.id}"`;
    case 'update': {
      const keys = Object.keys(m.patch ?? {});
      return `Modifier ${m.id} (${keys.join(', ') || 'aucun champ'})`;
    }
    case 'delete':
      return `Supprimer le nœud ${m.id}`;
    case 'connect':
      return `Connecter ${m.source} → ${m.target}`;
    case 'disconnect':
      return `Déconnecter ${m.source} ↛ ${m.target}`;
  }
}
