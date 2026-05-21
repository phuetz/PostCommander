import type { Node } from '@xyflow/react';

export type FieldType =
  | 'text'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'webhook-url'
  | 'node-ref' // dropdown listing other node ids
  | 'info';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  /** Number-specific */
  min?: number;
  max?: number;
  /** When false, the field is hidden — receives the full node data. */
  showWhen?: (data: any) => boolean;
  /** Allow `{{...}}` variable picker on textareas. */
  variablePicker?: boolean;
  /** Static informational content (rendered as a panel). */
  info?: string;
}

/**
 * Each entry maps a base node id (everything before the first `_`) to the list
 * of editable fields. Adding a new node type = one entry.
 *
 * The 18 entries below replace the previous `selectedNode.id.includes('xxx')`
 * cascade in NodeInspector.tsx, which was both brittle (substring matches!)
 * and a copy-paste minefield (~520 lines of nearly-identical JSX).
 */
export const NODE_SCHEMAS: Record<string, FieldSchema[]> = {
  'trig-url': [
    {
      key: 'url',
      label: 'URL à visiter',
      type: 'text',
      placeholder: 'https://news.ycombinator.com',
      description: "L'adresse de départ du scraper (Stagehand).",
      required: true,
    },
  ],
  'trig-cron': [
    {
      key: 'interval',
      label: 'Intervalle (minutes)',
      type: 'number',
      placeholder: '60',
      defaultValue: 60,
      min: 1,
      description: "Fréquence d'exécution automatique du workflow en minutes.",
      required: true,
    },
  ],
  'trig-webhook': [
    { key: '__webhook_url', label: 'URL de webhook', type: 'webhook-url' },
    { key: 'webhookSecret', label: 'Secret (Optionnel)', type: 'password', description: 'Si défini, la requête POST devra inclure ce secret dans le header Authorization: Bearer <secret>' },
  ],
  'trig-rss': [
    {
      key: 'rssUrl',
      label: 'Flux RSS',
      type: 'text',
      placeholder: 'https://news.ycombinator.com/rss',
      description: "L'URL XML du flux RSS à surveiller de manière automatique.",
    },
  ],
  'act-scrape': [
    {
      key: 'instruction',
      label: 'Instruction de scraping',
      type: 'textarea',
      placeholder: 'Extrais les 3 premiers articles (titre et lien)',
      description: "Décrivez en langage naturel les informations à extraire. L'agent IA comprendra de manière intelligente.",
      variablePicker: true,
    },
  ],
  'act-search': [
    {
      key: 'searchQuery',
      label: 'Requête de recherche',
      type: 'text',
      placeholder: 'e.g. dernières actualités IA en France',
    },
    {
      key: 'maxResults',
      label: 'Résultats max (1-10)',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 10,
    },
  ],
  'act-http': [
    {
      key: 'method',
      label: 'Méthode',
      type: 'select',
      defaultValue: 'GET',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
      ],
    },
    {
      key: 'url',
      label: 'URL API',
      type: 'text',
      placeholder: 'https://api.github.com/…',
      required: true,
    },
    {
      key: 'headers',
      label: 'Headers (Clé: Valeur)',
      type: 'textarea',
      placeholder: 'Content-Type: application/json\nAuthorization: Bearer KEY',
    },
    {
      key: 'body',
      label: 'Corps de la requête (JSON)',
      type: 'textarea',
      placeholder: '{ "key": "value" }',
      showWhen: (data) => data.method !== 'GET',
      variablePicker: true,
    },
  ],
  'act-file': [
    {
      key: 'fileType',
      label: 'Type de fichier',
      type: 'select',
      defaultValue: 'csv',
      options: [
        { value: 'csv', label: 'CSV (Tableur)' },
        { value: 'json', label: 'JSON' },
        { value: 'pdf', label: 'PDF (Texte brut)' },
      ],
    },
    { key: 'fileName', label: 'Nom du fichier', type: 'text', placeholder: 'ideas.csv' },
  ],
  'act-format': [
    {
      key: 'textTemplate',
      label: 'Modèle de texte',
      type: 'textarea',
      placeholder: 'Sujet: {{item.idea}}\nThème: {{item.topic}}',
      description: "Formatez ou fusionnez des variables sans appeler l'IA. Utilisez la notation double accolade.",
      variablePicker: true,
    },
  ],
  'act-ai': [
    {
      key: 'provider',
      label: 'Fournisseur',
      type: 'select',
      defaultValue: 'openai',
      options: [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'google', label: 'Google Gemini' },
        { value: 'mistral', label: 'Mistral AI' },
        { value: 'ollama', label: 'Ollama' },
      ],
    },
    {
      key: 'model',
      label: 'Modèle',
      type: 'text',
      placeholder: 'e.g. gpt-4o-mini',
      defaultValue: 'gpt-4o-mini',
    },
    {
      key: 'prompt',
      label: 'Prompt',
      type: 'textarea',
      placeholder: "Prends le JSON extrait et rédige un post LinkedIn attrayant avec une accroche forte…",
      description: 'Utilisez `{{item.champ}}` pour référencer la ligne courante d\'une boucle ou les données parentes.',
      variablePicker: true,
    },
  ],
  'act-db': [
    {
      key: 'dbAction',
      label: 'Action',
      type: 'select',
      defaultValue: 'save_post',
      options: [
        { value: 'save_post', label: 'Créer un brouillon de post (LinkedIn)' },
        { value: 'log_event', label: "Loguer un événement d'automatisation" },
      ],
    },
  ],
  'act-publish': [
    {
      key: 'publishUrl',
      label: 'URL API de publication',
      type: 'text',
      placeholder: 'https://patricehuetz.fr/api/publish',
    },
    {
      key: 'publishToken',
      label: "Jeton d'autorisation (Token)",
      type: 'password',
      placeholder: 'Bearer/Secret Token',
      description: "Envoie une requête POST contenant le titre de l'élément en cours et le contenu rédigé final.",
    },
  ],
  'act-post': [
    {
      key: '__info',
      label: 'Action finale',
      type: 'info',
      info: 'Le texte final généré par le nœud IA sera automatiquement sauvegardé en tant que brouillon dans votre section **Brouillons**.',
    },
  ],
  'act-image': [
    {
      key: 'imagePrompt',
      label: "Prompt de génération d'image",
      type: 'textarea',
      placeholder: "Description visuelle de l'image (ex: Un astronaute sur Mars, style cyberpunk)",
      description: "Entrez la description de l'illustration à associer à votre post. Vous pouvez injecter des variables du type `{{item.title}}`.",
      variablePicker: true,
    },
  ],
  'act-hook': [
    {
      key: 'hookStyle',
      label: "Style d'accroches",
      type: 'select',
      defaultValue: 'viral',
      options: [
        { value: 'viral', label: 'Viral & Court (Ats/LinkedIn)' },
        { value: 'question', label: 'Question Intrigante' },
        { value: 'story', label: 'Storytelling (Anecdote)' },
        { value: 'stats', label: 'Statistique choc' },
      ],
      description: "L'IA générera 3 propositions d'accroches conformes au style sélectionné.",
    },
  ],
  'act-tone': [
    {
      key: 'targetTone',
      label: 'Ton cible',
      type: 'select',
      defaultValue: 'professional',
      options: [
        { value: 'professional', label: 'Professionnel & Expert' },
        { value: 'casual', label: 'Décontracté & Amical' },
        { value: 'assertive', label: 'Direct & Assertif' },
        { value: 'humorous', label: 'Humoristique & Satirique' },
        { value: 'analytical', label: 'Analytique & Structuré' },
      ],
      description: 'Réécrit le post rédigé précédemment pour adopter précisément ce ton.',
    },
  ],
  'act-jsonpath': [
    {
      key: 'sourceVar',
      label: 'Nœud Source (Payload JSON)',
      type: 'node-ref',
      required: true,
      description: 'Sélectionnez le nœud fournissant la donnée JSON à extraire.',
    },
    {
      key: 'jsonPath',
      label: 'Expression JSONPath',
      type: 'text',
      placeholder: 'items[0].title',
      required: true,
      description: "L'expression pour extraire la donnée (ex: 'data[0].attributes.title').",
    },
  ],
  'act-filter': [
    {
      key: 'sourceArray',
      label: 'Tableau source',
      type: 'node-ref',
      required: true,
    },
    {
      key: 'filterField',
      label: 'Champ à filtrer',
      type: 'text',
      placeholder: 'item.likes',
      required: true,
    },
    {
      key: 'filterOperator',
      label: 'Opérateur',
      type: 'select',
      defaultValue: 'gt',
      options: [
        { value: 'gt', label: 'Supérieur à (>)' },
        { value: 'lt', label: 'Inférieur à (<)' },
        { value: 'eq', label: 'Égal à (==)' },
        { value: 'contains', label: 'Contient' },
      ],
    },
    {
      key: 'filterValue',
      label: 'Valeur de filtrage',
      type: 'text',
      placeholder: '10',
      required: true,
    },
  ],
  'log-loop': [
    {
      key: 'loopOver',
      label: 'Variable source',
      type: 'node-ref',
      description: 'Exécute tous les nœuds enfants connectés pour chaque élément du tableau renvoyé par ce nœud parent.',
    },
  ],
  'log-batch': [
    {
      key: 'batchArray',
      label: 'Tableau source (Batch)',
      type: 'node-ref',
      required: true,
      description: 'Le tableau des éléments à traiter en parallèle.',
    },
    {
      key: 'concurrency',
      label: 'Concurrence maximale',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 10,
      description: 'Nombre de sous-workflows exécutés en même temps.',
    },
  ],
  'log-condition': [
    {
      key: 'conditionField',
      label: 'Variable à tester',
      type: 'text',
      placeholder: 'item.likes',
    },
    {
      key: 'conditionOperator',
      label: 'Opérateur',
      type: 'select',
      defaultValue: 'gt',
      options: [
        { value: 'gt', label: 'Supérieur à (>)' },
        { value: 'lt', label: 'Inférieur à (<)' },
        { value: 'eq', label: 'Égal à (==)' },
        { value: 'contains', label: 'Contient' },
      ],
    },
    {
      key: 'conditionValue',
      label: 'Valeur de comparaison',
      type: 'text',
      placeholder: '10',
    },
  ],
  'log-delay': [
    {
      key: 'delaySeconds',
      label: "Délai d'attente (secondes)",
      type: 'number',
      placeholder: '60',
      defaultValue: 60,
      min: 1,
      description: 'Durée de temporisation en secondes avant de passer à l\'étape suivante.',
    },
  ],
};

/**
 * Resolve the schema for a given node based on its id prefix (everything
 * before the first underscore). Returns null if no schema is registered.
 */
export function getSchemaForNode(node: Node): FieldSchema[] | null {
  const base = node.id.split('_')[0];
  return NODE_SCHEMAS[base] ?? null;
}
