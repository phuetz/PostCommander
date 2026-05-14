import { z } from 'zod';

export const autoBlogConfigSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  articleType: z.enum(['fond-technique', 'news-comment', 'opinion-perso']),
  frequency: z.enum(['daily', 'weekly', 'biweekly']),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama', 'chatgpt-pro']),
  model: z.string().min(1, 'Model is required'),
  authorName: z.string().optional(),
  authorRole: z.string().optional(),
  authorReferences: z.string().optional(),
  status: z.enum(['active', 'paused']).default('active'),
});

export const updateAutoBlogConfigSchema = autoBlogConfigSchema.partial();
