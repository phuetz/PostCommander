import { generateText } from 'ai';
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

export async function runWorkflowBuilderAgent(
  userId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  currentState: WorkflowState
): Promise<{
  text: string;
  nextState: WorkflowState;
  steps?: Array<{
    text?: string;
    toolCalls?: Array<{
      name: string;
      args: any;
    }>;
  }>;
}> {
  logger.info(`Running workflow builder agent for user ${userId}`);

  // Determine model to use
  let model;
  try {
    model = await createModel('openai', 'gpt-4o-mini', userId);
  } catch (e) {
    logger.warn(`Failed to create OpenAI model, falling back to process env key if available: ${e}`);
    // If not configured, try to create model without database settings lookup or with default
    model = await createModel('openai', 'gpt-4o-mini');
  }

  let updatedState: WorkflowState = { ...currentState };

  const systemPrompt = `You are PostCommander's Workflow Builder AI, an agent that designs and modifies automated social media workflows in ReactFlow.
Your job is to translate the user's requirements into a functional graph of nodes and edges, or refine an existing one.

AVAILABLE NODES IN POSTCOMMANDER:
1. Trigger Nodes:
   - 'trig-url' (Label: "Cibler URL", iconName: "Globe") -> Start with a web URL. Config: 'url'.
   - 'trig-cron' (Label: "Planificateur (Cron)", iconName: "Clock") -> Runs on a schedule. Config: 'interval' (number, in minutes).
   - 'trig-webhook' (Label: "Webhook HTTP", iconName: "Zap") -> Runs when called. Config: None.
   - 'trig-rss' (Label: "Flux RSS", iconName: "Rss") -> Starts from an RSS Feed. Config: 'rssUrl'.

2. Action Nodes:
   - 'act-scrape' (Label: "Scraper (Stagehand)", iconName: "Search") -> Scrape pages with AI. Config: 'instruction'.
   - 'act-search' (Label: "Recherche Web (Tavily)", iconName: "Compass") -> Tavily search. Config: 'searchQuery', 'maxResults' (number).
   - 'act-http' (Label: "Requête HTTP API", iconName: "ExternalLink") -> API requests. Config: 'method' ('GET'|'POST'|'PUT'), 'url', 'headers', 'body'.
   - 'act-file' (Label: "Parseur de Fichier", iconName: "BookOpen") -> Read files. Config: 'fileType' ('csv'|'json'|'pdf'), 'fileName'.
   - 'act-format' (Label: "Formateur de Texte", iconName: "FileText") -> Variables templating. Config: 'textTemplate' (e.g. "Draft: {{item.text}}").
   - 'act-ai' (Label: "Traiter (LLM)", iconName: "Bot" or "Sparkles") -> LLM process. Config: 'provider' ('openai'|'anthropic'|'google'|'mistral'|'ollama'), 'model', 'prompt'.
   - 'act-db' (Label: "Enregistrer en Base", iconName: "Database") -> Save draft. Config: 'dbAction' ('save_post'|'log_event').
   - 'act-publish' (Label: "Publier sur Blog/CMS", iconName: "Share2") -> Publish externally. Config: 'publishUrl', 'publishToken'.
   - 'act-post' (Label: "Créer un Brouillon", iconName: "PenTool") -> Save post. Config: None.
   - 'act-image' (Label: "Générer Image (DALL-E)", iconName: "Image") -> Generates an image. Config: 'imagePrompt'.
   - 'act-hook' (Label: "Générateur d'Accroches", iconName: "Sparkles") -> Generates 3 hook options. Config: 'hookStyle' ('viral'|'educational'|'question'|'storytelling').
   - 'act-tone' (Label: "Ajusteur de Ton", iconName: "Smile") -> Rewrites content into another tone. Config: 'targetTone' ('professional'|'casual'|'empathetic'|'bold'|'humorous').

3. Logic Nodes:
   - 'log-loop' (Label: "Boucle Pour-Chaque", iconName: "Bot") -> Loops over parent results. Config: 'loopOver' (id of target scraping/file/search/rss node).
   - 'log-condition' (Label: "Condition (Si/Sinon)", iconName: "GitFork") -> If/Else test. Config: 'conditionField', 'conditionOperator' ('gt'|'lt'|'eq'|'contains'), 'conditionValue'.
   - 'log-delay' (Label: "Délai (Attendre)", iconName: "Clock") -> Timeout. Config: 'delaySeconds' (number).

LAYOUTING & IDS INSTRUCTIONS:
- Every node must have type: 'customNode' and a unique ID (e.g. 'trig-url_0', 'act-scrape_1', 'act-ai_2', 'act-post_3').
- Position nodes vertically starting at x: 250, y: 50, and incrementing y by 150 for each successive node in the main path.
- Connect consecutive nodes with edges. Edges should have: id (e.g. 'e-0-1'), source (id of source node), target (id of target node), animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 }.
- For conditional branches, shift positions on x axis (e.g. x: 100 for yes path, x: 400 for no path) to keep the layout neat and readable.

Always call setWorkflowState when the user wants to create, add, remove, or modify a workflow.
If the request is purely informational, just respond directly without calling the tool.
Respond in French to explain your design decisions. Keep it friendly and concise.`;

  const response = await generateText({
    model,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
    tools: {
      getWorkflowState: {
        description: 'Get the current nodes and edges of the workflow canvas.',
        parameters: z.object({}),
        execute: async () => {
          return updatedState;
        },
      },
      setWorkflowState: {
        description: 'Update the entire workflow with a list of nodes and connected edges.',
        parameters: z.object({
          nodes: z.array(
            z.object({
              id: z.string(),
              type: z.string().default('customNode'),
              position: z.object({
                x: z.number(),
                y: z.number(),
              }),
              data: z.object({
                label: z.string(),
                type: z.enum(['trigger', 'action', 'logic']),
                iconName: z.string(),
                url: z.string().optional(),
                instruction: z.string().optional(),
                prompt: z.string().optional(),
                interval: z.number().optional(),
                loopOver: z.string().optional(),
                fileType: z.string().optional(),
                fileName: z.string().optional(),
                method: z.string().optional(),
                headers: z.string().optional(),
                body: z.string().optional(),
                searchQuery: z.string().optional(),
                maxResults: z.number().optional(),
                textTemplate: z.string().optional(),
                dbAction: z.string().optional(),
                publishUrl: z.string().optional(),
                publishToken: z.string().optional(),
                provider: z.string().optional(),
                model: z.string().optional(),
                conditionField: z.string().optional(),
                conditionOperator: z.string().optional(),
                conditionValue: z.string().optional(),
                delaySeconds: z.number().optional(),
                rssUrl: z.string().optional(),
                imagePrompt: z.string().optional(),
                hookStyle: z.string().optional(),
                targetTone: z.string().optional(),
              }),
            })
          ),
          edges: z.array(
            z.object({
              id: z.string(),
              source: z.string(),
              target: z.string(),
              animated: z.boolean().default(true),
              style: z.record(z.any()).optional(),
            })
          ),
        }),
        execute: async (state) => {
          updatedState = state as WorkflowState;
          return { status: 'success', message: 'Workflow state updated successfully' };
        },
      },
      searchWeb: {
        description: 'Search the web using Tavily for technical API docs, webhook details, or structural design patterns.',
        parameters: z.object({
          query: z.string().describe('The web search query'),
        }),
        execute: async ({ query }) => {
          logger.info(`Agent calling searchWeb for: ${query}`);
          const results = await searchWeb(query, 3);
          return { results };
        },
      },
      scrapeUrlPreview: {
        description: 'Fetch and clean the HTML text content of a URL to preview elements, headlines, or page contents for a scraper node.',
        parameters: z.object({
          url: z.string().describe('The absolute URL to scrape content from'),
        }),
        execute: async ({ url }) => {
          logger.info(`Agent calling scrapeUrlPreview for: ${url}`);
          const text = await extractTextFromUrl(url);
          if (!text) {
            return { error: 'Failed to retrieve text from URL' };
          }
          // Limit length to avoid blowing up context window
          return { content: text.substring(0, 1500) };
        },
      },
    },
    maxSteps: 10, // Allow multi-step tool execution loop (agentic loop)
  });

  const steps = response.steps?.map((step) => ({
    text: step.text,
    toolCalls: step.toolCalls?.map((tc) => ({
      name: tc.toolName,
      args: tc.args,
    })),
  }));

  return {
    text: response.text,
    nextState: updatedState,
    steps,
  };
}
