import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { Variable } from 'lucide-react';

interface VariablePickerProps {
  node: Node;
  nodes: Node[];
  edges: Edge[];
  onPick: (insert: string) => void;
}

function findPredecessors(nodeId: string, edges: Edge[]): string[] {
  const reverseAdj: Record<string, string[]> = {};
  for (const e of edges) {
    (reverseAdj[e.target] ||= []).push(e.source);
  }
  const visited = new Set<string>();
  const queue: string[] = [nodeId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const parent of reverseAdj[cur] ?? []) {
      if (!visited.has(parent)) {
        visited.add(parent);
        queue.push(parent);
      }
    }
  }
  return Array.from(visited);
}

interface Suggestion {
  label: string;
  insert: string;
  hint?: string;
}

function suggestionsForPredecessor(predNode: Node): Suggestion[] {
  const base = predNode.id.split('_')[0];
  const id = predNode.id;
  switch (base) {
    case 'log-loop':
      return [
        { label: '{{item}}', insert: '{{item}}', hint: 'élément courant de la boucle' },
        { label: '{{item.title}}', insert: '{{item.title}}' },
        { label: '{{item.link}}', insert: '{{item.link}}' },
        { label: '{{item.description}}', insert: '{{item.description}}' },
        { label: '{{item.content}}', insert: '{{item.content}}' },
      ];
    case 'act-http':
      return [
        { label: `{{${id}.response}}`, insert: `{{${id}.response}}` },
        { label: `{{${id}.response.0}}`, insert: `{{${id}.response.0}}` },
      ];
    case 'act-scrape':
      return [
        { label: `{{${id}.content}}`, insert: `{{${id}.content}}` },
      ];
    case 'act-search':
      return [
        { label: `{{${id}.0}}`, insert: `{{${id}.0}}` },
        { label: `{{${id}.0.url}}`, insert: `{{${id}.0.url}}` },
        { label: `{{${id}.0.content}}`, insert: `{{${id}.0.content}}` },
      ];
    case 'act-ai':
      return [{ label: `{{${id}}}`, insert: `{{${id}}}`, hint: 'sortie LLM' }];
    case 'trig-webhook':
      return [
        { label: '{{webhook.body}}', insert: '{{webhook.body}}' },
      ];
    case 'trig-rss':
      return [
        { label: '{{item}}', insert: '{{item}}', hint: 'rss → utiliser via boucle' },
      ];
    default:
      return [];
  }
}

export function VariablePicker({ node, nodes, edges, onPick }: VariablePickerProps) {
  const suggestions = useMemo<Suggestion[]>(() => {
    const predIds = findPredecessors(node.id, edges);
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const pid of predIds) {
      const predNode = nodes.find((n) => n.id === pid);
      if (!predNode) continue;
      for (const s of suggestionsForPredecessor(predNode)) {
        if (!seen.has(s.insert)) {
          seen.add(s.insert);
          out.push(s);
        }
      }
    }
    return out;
  }, [node.id, nodes, edges]);

  if (suggestions.length === 0) {
    return (
      <div className="text-[10px] text-gray-400 italic">
        Aucune variable disponible — connectez d'abord un nœud parent.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {suggestions.map((s) => (
        <button
          key={s.insert}
          type="button"
          onClick={() => onPick(s.insert)}
          title={s.hint}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-200/50 dark:border-brand-800/50 rounded transition-colors"
        >
          <Variable size={9} />
          {s.label}
        </button>
      ))}
    </div>
  );
}
