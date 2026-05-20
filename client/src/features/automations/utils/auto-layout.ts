import type { Node, Edge } from '@xyflow/react';

const COLUMN_WIDTH = 280;
const ROW_HEIGHT = 140;
const ORIGIN_X = 250;
const ORIGIN_Y = 50;

/**
 * Topological-sort + vertical layout. Triggers occupy depth 0, downstream
 * nodes are placed at depth = max(predecessor depth) + 1. Nodes that share
 * the same depth are spread horizontally so branches don't overlap.
 *
 * Cycle-safe: nodes still unvisited after the topo pass land at depth 0 with
 * the column = the order in which we encountered them.
 */
export function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const adj: Record<string, string[]> = {};
  const reverseAdj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  for (const n of nodes) {
    adj[n.id] = [];
    reverseAdj[n.id] = [];
    inDegree[n.id] = 0;
  }
  for (const e of edges) {
    if (adj[e.source] && reverseAdj[e.target]) {
      adj[e.source].push(e.target);
      reverseAdj[e.target].push(e.source);
      inDegree[e.target]++;
    }
  }

  // Kahn-style topological sort that tracks depth
  const depth: Record<string, number> = {};
  const queue: string[] = [];
  for (const n of nodes) {
    if (inDegree[n.id] === 0) {
      depth[n.id] = 0;
      queue.push(n.id);
    }
  }
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const next of adj[id]) {
      depth[next] = Math.max(depth[next] ?? 0, (depth[id] ?? 0) + 1);
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }
  // Nodes still without depth (cycle members / disconnected components) → put at 0
  for (const n of nodes) {
    if (depth[n.id] === undefined) depth[n.id] = 0;
  }

  // Group by depth
  const byDepth: Record<number, string[]> = {};
  for (const n of nodes) {
    const d = depth[n.id];
    (byDepth[d] ||= []).push(n.id);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const maxDepth = Math.max(...Object.keys(byDepth).map(Number), 0);

  // Position depth 0 nodes first to establish baseline parent coordinates
  if (byDepth[0]) {
    const ids = byDepth[0];
    const offset = -((ids.length - 1) * COLUMN_WIDTH) / 2;
    ids.forEach((id, col) => {
      positions[id] = {
        x: ORIGIN_X + offset + col * COLUMN_WIDTH,
        y: ORIGIN_Y,
      };
    });
  }

  // Position subsequent depths, ordering nodes by parent barycenters to minimize crossing
  for (let d = 1; d <= maxDepth; d++) {
    const ids = byDepth[d] || [];
    if (ids.length === 0) continue;

    // Calculate barycenter (average parent X) for each node at this depth
    const barycenters = ids.map((id) => {
      const parents = reverseAdj[id] || [];
      const positionedParents = parents.filter((pId) => positions[pId] !== undefined);

      let avgX = 0;
      if (positionedParents.length > 0) {
        avgX =
          positionedParents.reduce((sum, pId) => sum + positions[pId].x, 0) /
          positionedParents.length;
      } else {
        const originalNode = nodes.find((n) => n.id === id);
        avgX = originalNode?.position?.x ?? ORIGIN_X;
      }
      return { id, avgX };
    });

    // Sort by average parent X position
    barycenters.sort((a, b) => a.avgX - b.avgX);
    const sortedIds = barycenters.map((item) => item.id);

    // Position sorted nodes
    const offset = -((sortedIds.length - 1) * COLUMN_WIDTH) / 2;
    sortedIds.forEach((id, col) => {
      positions[id] = {
        x: ORIGIN_X + offset + col * COLUMN_WIDTH,
        y: ORIGIN_Y + d * ROW_HEIGHT,
      };
    });
  }

  return nodes.map((n) => ({ ...n, position: positions[n.id] ?? n.position }));
}
