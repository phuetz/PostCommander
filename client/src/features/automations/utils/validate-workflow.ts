import type { Node, Edge } from '@xyflow/react';
import { NODE_SCHEMAS } from '../constants/node-schemas';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  code: 'noTrigger' | 'orphanNode' | 'cycle' | 'invalidConfig';
  message: string;
  nodeId?: string;
}

export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // noTrigger
  const triggers = nodes.filter((n) => (n.data as any)?.type === 'trigger');
  if (nodes.length > 0 && triggers.length === 0) {
    issues.push({
      severity: 'error',
      code: 'noTrigger',
      message: 'Aucun déclencheur sur le canevas — ajoutez un nœud Trigger (URL, Cron, Webhook ou RSS).',
    });
  }

  // orphanNode: non-trigger nodes with no incoming edge
  const hasIncoming = new Set(edges.map((e) => e.target));
  for (const node of nodes) {
    if ((node.data as any)?.type === 'trigger') continue;
    if (!hasIncoming.has(node.id)) {
      issues.push({
        severity: 'warning',
        code: 'orphanNode',
        message: `"${(node.data as any)?.label || node.id}" n'est connecté à aucun parent — il ne sera jamais exécuté.`,
        nodeId: node.id,
      });
    }
  }

  // cycle: DFS with coloring (0 = white, 1 = gray, 2 = black)
  const adj: Record<string, string[]> = {};
  for (const e of edges) {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  }
  const color: Record<string, number> = {};
  let cycleFound = false;
  function dfs(id: string) {
    if (cycleFound) return;
    color[id] = 1;
    for (const next of adj[id] ?? []) {
      if (color[next] === 1) {
        cycleFound = true;
        return;
      }
      if (color[next] !== 2) dfs(next);
    }
    color[id] = 2;
  }
  for (const node of nodes) {
    if (color[node.id] === undefined) dfs(node.id);
    if (cycleFound) break;
  }
  if (cycleFound) {
    issues.push({
      severity: 'error',
      code: 'cycle',
      message: 'Le graphe contient un cycle — un nœud finit par se reboucler sur lui-même.',
    });
  }

  // invalidConfig: required fields missing per NODE_SCHEMAS
  for (const node of nodes) {
    const base = node.id.split('_')[0];
    const schema = NODE_SCHEMAS[base];
    if (!schema) continue;
    for (const field of schema) {
      if (!field.required) continue;
      const value = (node.data as any)?.[field.key];
      const empty = value === undefined || value === null || value === '';
      if (empty) {
        issues.push({
          severity: 'warning',
          code: 'invalidConfig',
          message: `"${(node.data as any)?.label || node.id}" : le champ "${field.label}" est vide.`,
          nodeId: node.id,
        });
      }
    }
  }

  return issues;
}
