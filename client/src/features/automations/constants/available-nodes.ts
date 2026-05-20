import type { AvailableNode } from '../types';

export const AVAILABLE_NODES: AvailableNode[] = [
  // Triggers
  { type: 'trigger', id: 'trig-url', label: 'Cibler URL', iconName: 'Globe' },
  { type: 'trigger', id: 'trig-rss', label: 'Flux RSS', iconName: 'Rss' },
  { type: 'trigger', id: 'trig-cron', label: 'Planificateur (Cron)', iconName: 'Clock' },
  { type: 'trigger', id: 'trig-webhook', label: 'Webhook HTTP', iconName: 'Zap' },

  // Actions
  { type: 'action', id: 'act-scrape', label: 'Scraper (Stagehand)', iconName: 'Search' },
  { type: 'action', id: 'act-search', label: 'Recherche Web (Tavily)', iconName: 'Compass' },
  { type: 'action', id: 'act-http', label: 'Requête HTTP API', iconName: 'ExternalLink' },
  { type: 'action', id: 'act-file', label: 'Parseur de Fichier', iconName: 'BookOpen' },
  { type: 'action', id: 'act-format', label: 'Formateur de Texte', iconName: 'FileText' },
  { type: 'action', id: 'act-ai', label: 'Traiter (LLM)', iconName: 'Bot' },
  { type: 'action', id: 'act-hook', label: "Générateur d'accroches", iconName: 'Sparkles' },
  { type: 'action', id: 'act-tone', label: 'Ajusteur de ton', iconName: 'PenTool' },
  { type: 'action', id: 'act-image', label: "Générateur d'Image", iconName: 'Image' },
  { type: 'action', id: 'act-db', label: 'Enregistrer en Base', iconName: 'Database' },
  { type: 'action', id: 'act-publish', label: 'Publier sur Blog/CMS', iconName: 'Share2' },
  { type: 'action', id: 'act-post', label: 'Créer un Brouillon', iconName: 'PenTool' },

  // Logic
  { type: 'logic', id: 'log-loop', label: 'Boucle Pour-Chaque', iconName: 'Bot' },
  { type: 'logic', id: 'log-condition', label: 'Condition (Si/Sinon)', iconName: 'GitFork' },
  { type: 'logic', id: 'log-delay', label: 'Délai (Attendre)', iconName: 'Clock' },
];
