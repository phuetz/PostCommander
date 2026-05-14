export const LLM_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & affordable' },
    ],
    requiresApiKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Most capable' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Fast & capable' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Fastest' },
    ],
    requiresApiKey: true,
  },
  {
    id: 'google',
    name: 'Google',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast & capable' },
      { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', description: 'Most capable' },
    ],
    requiresApiKey: true,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Most capable' },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Fast' },
    ],
    requiresApiKey: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    models: [
      { id: 'llama3.3', name: 'Llama 3.3', description: 'Open source' },
      { id: 'mistral', name: 'Mistral 7B', description: 'Compact' },
      { id: 'qwen2.5', name: 'Qwen 2.5', description: 'Multilingual' },
    ],
    requiresApiKey: false,
  },
  {
    id: 'chatgpt-pro',
    name: 'ChatGPT Pro (compte connecté)',
    models: [
      { id: 'gpt-5', name: 'GPT-5', description: 'Codex Responses' },
      { id: 'gpt-5-codex', name: 'GPT-5 Codex', description: 'Pour code/raisonnement' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal' },
    ],
    requiresApiKey: false,
  },
] as const;

export type LLMProviderId = (typeof LLM_PROVIDERS)[number]['id'];
