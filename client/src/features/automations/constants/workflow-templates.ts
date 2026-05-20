import type { WorkflowTemplate } from '../types';

export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  hackerNews: {
    name: 'Veille Hacker News (Tech)',
    nodes: [
      {
        id: 'trig-url_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Cibler URL', type: 'trigger', iconName: 'Globe', url: 'https://news.ycombinator.com', instruction: '', prompt: '' },
      },
      {
        id: 'act-scrape_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Scraper (Stagehand)', type: 'action', iconName: 'Search', url: '', instruction: 'Extract the top 3 news articles and their URLs', prompt: '' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Traiter (LLM)', type: 'action', iconName: 'Bot', url: '', instruction: '', prompt: 'Summarize these top 3 tech stories in a short, punchy LinkedIn post. Add a hook, key takeaways, and relevant hashtags.' },
      },
      {
        id: 'act-post_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool', url: '', instruction: '', prompt: '' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-url_0', target: 'act-scrape_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-scrape_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-post_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  blogRepurpose: {
    name: 'Extraction de Blog / Repost',
    nodes: [
      {
        id: 'trig-url_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Cibler URL', type: 'trigger', iconName: 'Globe', url: 'https://patricehuetz.fr', instruction: '', prompt: '' },
      },
      {
        id: 'act-scrape_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Scraper (Stagehand)', type: 'action', iconName: 'Search', url: '', instruction: 'Extract the main article content, title, and key sections from the page', prompt: '' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Traiter (LLM)', type: 'action', iconName: 'Bot', url: '', instruction: '', prompt: 'Based on this article, generate an engaging thread of 4 tweets summarizing the core message. End with a strong call to action.' },
      },
      {
        id: 'act-post_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool', url: '', instruction: '', prompt: '' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-url_0', target: 'act-scrape_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-scrape_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-post_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  loopTechNews: {
    name: 'Boucle Multi-Articles (HN)',
    nodes: [
      {
        id: 'trig-url_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Cibler URL', type: 'trigger', iconName: 'Globe', url: 'https://news.ycombinator.com', instruction: '', prompt: '' },
      },
      {
        id: 'act-scrape_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Scraper (Stagehand)', type: 'action', iconName: 'Search', url: '', instruction: 'Extract the top 5 articles with titles and links', prompt: '' },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-scrape_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Sparkles', prompt: 'Write a dedicated, insightful tweet discussing this specific news article: Title: {{item.title}} (Link: {{item.link}}).' },
      },
      {
        id: 'act-post_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-url_0', target: 'act-scrape_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-scrape_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-post_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  csvImportGenerator: {
    name: 'Import CSV & Rédaction',
    nodes: [
      {
        id: 'trig-cron_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Planificateur (Cron)', type: 'trigger', iconName: 'Clock', interval: 60 },
      },
      {
        id: 'act-file_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Parseur de Fichier', type: 'action', iconName: 'BookOpen', fileType: 'csv', fileName: 'ideas.csv' },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-file_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Sparkles', prompt: 'Create an expert post on Agile/Product development using this raw idea from the CSV: "{{item.idea}}". Tone: professional and inspiring.' },
      },
      {
        id: 'act-post_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-cron_0', target: 'act-file_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-file_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-post_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  webhookApiIntegration: {
    name: 'Intégration API & Webhook',
    nodes: [
      {
        id: 'trig-webhook_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Webhook HTTP', type: 'trigger', iconName: 'Zap' },
      },
      {
        id: 'act-http_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Requête HTTP API', type: 'action', iconName: 'ExternalLink', method: 'GET', url: 'https://dev.to/api/articles?username=patricehuetz', headers: 'Accept: application/json' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Traiter (LLM)', type: 'action', iconName: 'Bot', prompt: 'Here is the latest published article on Dev.to: Title: {{act-http_1.response.0.title}}. Write a summary update for LinkedIn.' },
      },
      {
        id: 'act-post_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-webhook_0', target: 'act-http_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-http_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-post_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  tavilySearchAlert: {
    name: 'Veille & Recherche Web Tavily',
    nodes: [
      {
        id: 'trig-cron_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Planificateur (Cron)', type: 'trigger', iconName: 'Clock', interval: 1440 },
      },
      {
        id: 'act-search_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Recherche Web (Tavily)', type: 'action', iconName: 'Compass', searchQuery: 'dernieres actualites IA agents autonomes', maxResults: 3 },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-search_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Create an analysis LinkedIn post on this news: Title: {{item.title}}\nContent: {{item.content}}' },
      },
      {
        id: 'act-db_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Enregistrer en Base', type: 'action', iconName: 'Database', dbAction: 'save_post' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-cron_0', target: 'act-search_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-search_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-db_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  autoBloggingCMS: {
    name: 'Veille & Publication CMS',
    nodes: [
      {
        id: 'trig-webhook_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Webhook HTTP', type: 'trigger', iconName: 'Zap' },
      },
      {
        id: 'act-search_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Recherche Web (Tavily)', type: 'action', iconName: 'Compass', searchQuery: 'Agile Product Management trends 2026', maxResults: 1 },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Based on this news, write a comprehensive article for a tech blog: {{act-search_1.0.content}}' },
      },
      {
        id: 'act-format_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Formateur de Texte', type: 'action', iconName: 'FileText', textTemplate: 'Article rédigé le {{current_date}}.\nSource: {{act-search_1.0.url}}\n\nContenu:\n{{act-ai_2}}' },
      },
      {
        id: 'act-publish_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Publier sur Blog/CMS', type: 'action', iconName: 'Share2', publishUrl: 'https://patricehuetz.fr/api/publish', publishToken: 'Bearer Secret_Token_123' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-webhook_0', target: 'act-search_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-search_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-format_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-format_3', target: 'act-publish_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  rssToLinkedIn: {
    name: 'Veille RSS & Rédaction Multi-Réseaux',
    nodes: [
      {
        id: 'trig-rss_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Flux RSS', type: 'trigger', iconName: 'Rss', rssUrl: 'https://news.ycombinator.com/rss' },
      },
      {
        id: 'log-loop_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'trig-rss_0' },
      },
      {
        id: 'act-ai_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Create an engaging educational post about this article: Title: {{item.title}}\nDescription: {{item.description}}' },
      },
      {
        id: 'act-image_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: "Générateur d'Image", type: 'action', iconName: 'Image', imagePrompt: 'A futuristic tech illustration representing: {{item.title}}' },
      },
      {
        id: 'act-post_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-rss_0', target: 'log-loop_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'log-loop_1', target: 'act-ai_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'act-ai_2', target: 'act-image_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-image_3', target: 'act-post_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
  toneOptimizer: {
    name: 'Rédaction & Optimisation du Ton',
    nodes: [
      {
        id: 'trig-cron_0',
        type: 'customNode',
        position: { x: 250, y: 50 },
        data: { label: 'Planificateur (Cron)', type: 'trigger', iconName: 'Clock', interval: 1440 },
      },
      {
        id: 'act-search_1',
        type: 'customNode',
        position: { x: 250, y: 180 },
        data: { label: 'Recherche Web (Tavily)', type: 'action', iconName: 'Compass', searchQuery: 'Agile development trends 2026', maxResults: 2 },
      },
      {
        id: 'log-loop_2',
        type: 'customNode',
        position: { x: 250, y: 310 },
        data: { label: 'Boucle Pour-Chaque', type: 'logic', iconName: 'Bot', loopOver: 'act-search_1' },
      },
      {
        id: 'act-ai_3',
        type: 'customNode',
        position: { x: 250, y: 440 },
        data: { label: 'Rédiger par IA', type: 'action', iconName: 'Bot', prompt: 'Summarize the core message of this news: {{item.title}}\nContent: {{item.content}}' },
      },
      {
        id: 'act-tone_4',
        type: 'customNode',
        position: { x: 250, y: 570 },
        data: { label: 'Ajusteur de ton', type: 'action', iconName: 'PenTool', targetTone: 'professional' },
      },
      {
        id: 'act-post_5',
        type: 'customNode',
        position: { x: 250, y: 700 },
        data: { label: 'Créer un Brouillon', type: 'action', iconName: 'PenTool' },
      },
    ],
    edges: [
      { id: 'e-0-1', source: 'trig-cron_0', target: 'act-search_1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-1-2', source: 'act-search_1', target: 'log-loop_2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-2-3', source: 'log-loop_2', target: 'act-ai_3', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-3-4', source: 'act-ai_3', target: 'act-tone_4', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-4-5', source: 'act-tone_4', target: 'act-post_5', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
    ],
  },
};

export type WorkflowTemplateKey = keyof typeof WORKFLOW_TEMPLATES;
