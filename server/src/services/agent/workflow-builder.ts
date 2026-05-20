import { generateText, streamText } from 'ai';
import { z } from 'zod';
import { createModel } from '../llm/provider-factory.js';
import { logger } from '../../utils/logger.js';
import { searchWeb } from '../web-search.js';
import { extractTextFromUrl } from '../../utils/scraper.js';

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: 'trigger' | 'action' | 'logic';
    iconName: string;
    url?: string;
    instruction?: string;
    prompt?: string;
    interval?: number;
    loopOver?: string;
    fileType?: string;
    fileName?: string;
    method?: string;
    headers?: string;
    body?: string;
    searchQuery?: string;
    maxResults?: number;
    textTemplate?: string;
    dbAction?: string;
    publishUrl?: string;
    publishToken?: string;
    provider?: string;
    model?: string;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
    delaySeconds?: number;
    rssUrl?: string;
    imagePrompt?: string;
    hookStyle?: string;
    targetTone?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export type WorkflowMutation =
  | { kind: 'add'; node: WorkflowNode }
  | { kind: 'update'; id: string; patch: Partial<WorkflowNode['data']> }
  | { kind: 'delete'; id: string }
  | { kind: 'connect'; source: string; target: string; edgeId: string }
  | { kind: 'disconnect'; source: string; target: string };

export type AgentStreamChunk =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-call'; toolCallId: string; name: string; args: any }
  | { type: 'tool-result'; toolCallId: string; result: any; mutation?: WorkflowMutation }
  | { type: 'step-finish' }
  | { type: 'done'; finalState: WorkflowState; fullText: string }
  | { type: 'error'; error: string };

const EDGE_STYLE = { stroke: '#8b5cf6', strokeWidth: 2 } as const;

const SYSTEM_PROMPT = `You are PostCommander's Workflow Builder AI, an agent that designs and modifies automated social media workflows in ReactFlow.
Your job is to translate the user's requirements into a functional graph of nodes and edges, or refine an existing one.

AVAILABLE NODES IN POSTCOMMANDER:
1. Trigger Nodes:
   - 'trig-url' (Label: "Cibler URL", iconName: "Globe") -> Start with a web URL. Config: 'url'.
   - 'trig-cron' (Label: "Planificateur (Cron)", iconName: "Clock") -> Runs on a schedule. Config: 'interval' (number, in minutes).
   - 'trig-webhook' (Label: "Webhook HTTP", iconName: "Zap") -> Runs when called. Config: None.
   - 'trig-rss' (Label: "Flux RSS", iconName: "Rss") -> Starts from an RSS Feed. Config: 'rssUrl'.

2. Action Nodes:
   - 'act-scrape' (Label: "Scraper (Stagehand)", iconName: "Search") -> Scrape pages with AI. Config: 'instruction'.
   - 'act-search' (Label: "Recherche Web (Tavily)", iconName: "Compass") -> Tavily search. Config: 'searchQuery', 'maxResults'.
   - 'act-http' (Label: "Requête HTTP API", iconName: "ExternalLink") -> API requests. Config: 'method', 'url', 'headers', 'body'.
   - 'act-file' (Label: "Parseur de Fichier", iconName: "BookOpen") -> Read files. Config: 'fileType', 'fileName'.
   - 'act-format' (Label: "Formateur de Texte", iconName: "FileText") -> Variables templating. Config: 'textTemplate'.
   - 'act-ai' (Label: "Traiter (LLM)", iconName: "Bot") -> LLM process. Config: 'provider', 'model', 'prompt'.
   - 'act-db' (Label: "Enregistrer en Base", iconName: "Database") -> Save draft. Config: 'dbAction'.
   - 'act-publish' (Label: "Publier sur Blog/CMS", iconName: "Share2") -> Publish externally. Config: 'publishUrl', 'publishToken'.
   - 'act-post' (Label: "Créer un Brouillon", iconName: "PenTool") -> Save post. Config: None.
   - 'act-image' (Label: "Générer Image (DALL-E)", iconName: "Image") -> Generates an image. Config: 'imagePrompt'.
   - 'act-hook' (Label: "Générateur d'Accroches", iconName: "Sparkles") -> Generates 3 hook options. Config: 'hookStyle'.
   - 'act-tone' (Label: "Ajusteur de Ton", iconName: "PenTool") -> Rewrites content into another tone. Config: 'targetTone'.

3. Logic Nodes:
   - 'log-loop' (Label: "Boucle Pour-Chaque", iconName: "Bot") -> Loops over parent results. Config: 'loopOver' (id of source node).
   - 'log-condition' (Label: "Condition (Si/Sinon)", iconName: "GitFork") -> If/Else test. Config: 'conditionField', 'conditionOperator', 'conditionValue'.
   - 'log-delay' (Label: "Délai (Attendre)", iconName: "Clock") -> Timeout. Config: 'delaySeconds'.

INCREMENTAL TOOLS (use these to modify the graph):
- addNode({ kind, label, iconName, data, position? }): append a new node. Position auto-computed below last if omitted. The 'kind' should be one of the IDs above (e.g. 'trig-url', 'act-scrape'). Always set 'type' inside data to 'trigger', 'action', or 'logic'.
- updateNode({ id, patch }): merge a partial update into an existing node's data. Use this for renames or config tweaks.
- deleteNode({ id }): remove a node AND its connected edges. Only use when explicitly asked.
- connectNodes({ source, target }): add an edge between two existing nodes.
- disconnectNodes({ source, target }): remove an edge.
- getWorkflowState(): inspect current nodes/edges if you forgot what's on the canvas.
- searchWeb({ query }), scrapeUrlPreview({ url }): research tools for smarter design.

RULES:
- PREFER INCREMENTAL EDITS: when the user wants small changes, use updateNode / connectNodes rather than rebuilding from scratch. Preserve existing positions.
- For a brand-new workflow on an empty canvas, call addNode multiple times then connectNodes to link them.
- Never use deleteNode unless the user explicitly says so.
- Respond in French. Explain your design decisions concisely and reference the nodes you created/modified.`;

function nextNodePosition(state: WorkflowState): { x: number; y: number } {
  if (state.nodes.length === 0) return { x: 250, y: 50 };
  const maxY = Math.max(...state.nodes.map((n) => n.position.y));
  return { x: 250, y: maxY + 130 };
}

function buildTools(state: WorkflowState) {
  return {
    getWorkflowState: {
      description: 'Inspect the current nodes and edges on the canvas.',
      parameters: z.object({}),
      execute: async () => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    },
    addNode: {
      description:
        "Append a new node to the canvas. 'kind' must be one of the documented node IDs (e.g. 'trig-url'). Position is auto-computed if omitted.",
      parameters: z.object({
        kind: z.string().describe("Node template id, e.g. 'trig-url', 'act-scrape', 'log-loop'."),
        label: z.string(),
        iconName: z.string(),
        data: z.record(z.any()).describe("Node data — must include 'type' ('trigger' | 'action' | 'logic')."),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
      execute: async ({ kind, label, iconName, data, position }: any) => {
        const id = `${kind}_${state.nodes.length}`;
        const node: WorkflowNode = {
          id,
          type: 'customNode',
          position: position ?? nextNodePosition(state),
          data: {
            label,
            iconName,
            type: data.type ?? 'action',
            ...data,
          },
        };
        state.nodes.push(node);
        const mutation: WorkflowMutation = { kind: 'add', node };
        return { status: 'success', node, mutation };
      },
    },
    updateNode: {
      description: 'Merge a partial patch into an existing node\'s data. Use for renames or config tweaks.',
      parameters: z.object({
        id: z.string(),
        patch: z.record(z.any()),
      }),
      execute: async ({ id, patch }: any) => {
        const node = state.nodes.find((n) => n.id === id);
        if (!node) return { status: 'error', message: `Node ${id} not found` };
        node.data = { ...node.data, ...patch };
        const mutation: WorkflowMutation = { kind: 'update', id, patch };
        return { status: 'success', node, mutation };
      },
    },
    deleteNode: {
      description: 'Remove a node and all its connected edges. Use only when the user explicitly asks.',
      parameters: z.object({ id: z.string() }),
      execute: async ({ id }: any) => {
        const before = state.nodes.length;
        state.nodes = state.nodes.filter((n) => n.id !== id);
        state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
        if (state.nodes.length === before) {
          return { status: 'error', message: `Node ${id} not found` };
        }
        const mutation: WorkflowMutation = { kind: 'delete', id };
        return { status: 'success', mutation };
      },
    },
    connectNodes: {
      description: 'Add an edge between two existing nodes.',
      parameters: z.object({ source: z.string(), target: z.string() }),
      execute: async ({ source, target }: any) => {
        if (!state.nodes.find((n) => n.id === source)) {
          return { status: 'error', message: `Source node ${source} not found` };
        }
        if (!state.nodes.find((n) => n.id === target)) {
          return { status: 'error', message: `Target node ${target} not found` };
        }
        const edgeId = `e-${source}-${target}`;
        if (state.edges.find((e) => e.id === edgeId)) {
          return { status: 'noop', message: 'Edge already exists' };
        }
        state.edges.push({ id: edgeId, source, target, animated: true, style: { ...EDGE_STYLE } });
        const mutation: WorkflowMutation = { kind: 'connect', source, target, edgeId };
        return { status: 'success', edgeId, mutation };
      },
    },
    disconnectNodes: {
      description: 'Remove an edge between two nodes.',
      parameters: z.object({ source: z.string(), target: z.string() }),
      execute: async ({ source, target }: any) => {
        const before = state.edges.length;
        state.edges = state.edges.filter((e) => !(e.source === source && e.target === target));
        if (state.edges.length === before) {
          return { status: 'error', message: 'Edge not found' };
        }
        const mutation: WorkflowMutation = { kind: 'disconnect', source, target };
        return { status: 'success', mutation };
      },
    },
    searchWeb: {
      description: 'Search the web using Tavily for API docs, webhook details, or design patterns.',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }: any) => {
        logger.info(`Agent calling searchWeb for: ${query}`);
        const results = await searchWeb(query, 3);
        return { results };
      },
    },
    scrapeUrlPreview: {
      description: 'Fetch the text content of a URL to preview headlines or page structure.',
      parameters: z.object({ url: z.string() }),
      execute: async ({ url }: any) => {
        logger.info(`Agent calling scrapeUrlPreview for: ${url}`);
        const text = await extractTextFromUrl(url);
        if (!text) return { error: 'Failed to retrieve text from URL' };
        return { content: text.substring(0, 1500) };
      },
    },
  };
}

async function resolveModel(userId: string) {
  try {
    return await createModel('openai', 'gpt-4o-mini', userId);
  } catch (e) {
    logger.warn(`Falling back to env OpenAI key: ${e}`);
    return await createModel('openai', 'gpt-4o-mini');
  }
}

/**
 * Streamed agent: emits chunks as the model generates text and invokes tools.
 * The shared `state` object is mutated in place by the tools, and the final
 * snapshot is emitted in the `done` chunk.
 */
export async function runWorkflowBuilderAgentStream(
  userId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  currentState: WorkflowState,
  onChunk: (chunk: AgentStreamChunk) => void,
): Promise<{ finalState: WorkflowState; fullText: string }> {
  logger.info(`[agent-stream] user=${userId} messages=${messages.length}`);

  const model = await resolveModel(userId);
  // Deep clone so tool mutations don't leak into caller's reference until we're done.
  const state: WorkflowState = {
    nodes: currentState.nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: currentState.edges.map((e) => ({ ...e })),
  };
  const tools = buildTools(state);

  let fullText = '';
  try {
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      tools,
      maxSteps: 10,
    });

    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case 'text-delta':
          fullText += chunk.textDelta;
          onChunk({ type: 'text-delta', delta: chunk.textDelta });
          break;
        case 'tool-call':
          onChunk({
            type: 'tool-call',
            toolCallId: chunk.toolCallId,
            name: chunk.toolName,
            args: chunk.args,
          });
          break;
        case 'tool-result': {
          const result = chunk.result as any;
          onChunk({
            type: 'tool-result',
            toolCallId: chunk.toolCallId,
            result,
            mutation: result?.mutation,
          });
          break;
        }
        case 'step-finish':
          onChunk({ type: 'step-finish' });
          break;
        default:
          // ignore other event types (e.g. 'finish', 'step-start', reasoning)
          break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[agent-stream] failed: ${message}`);
    onChunk({ type: 'error', error: message });
    throw err;
  }

  onChunk({ type: 'done', finalState: state, fullText });
  return { finalState: state, fullText };
}

/**
 * Legacy non-streaming entry point. Kept for backwards-compat with the existing
 * `POST /automations/agent/build` endpoint while the front migrates to SSE.
 * It calls the streaming function under the hood and collates chunks.
 */
export async function runWorkflowBuilderAgent(
  userId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  currentState: WorkflowState,
): Promise<{
  text: string;
  nextState: WorkflowState;
  steps?: Array<{
    text?: string;
    toolCalls?: Array<{ name: string; args: any }>;
  }>;
}> {
  logger.info(`[agent-legacy] user=${userId}`);

  const model = await resolveModel(userId);
  const state: WorkflowState = {
    nodes: currentState.nodes.map((n) => ({ ...n, data: { ...n.data } })),
    edges: currentState.edges.map((e) => ({ ...e })),
  };
  const tools = buildTools(state);

  const response = await generateText({
    model,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools,
    maxSteps: 10,
  });

  const steps = response.steps?.map((step) => ({
    text: step.text,
    toolCalls: step.toolCalls?.map((tc) => ({ name: tc.toolName, args: tc.args })),
  }));

  return { text: response.text, nextState: state, steps };
}
