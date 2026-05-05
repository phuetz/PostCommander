import { z } from 'zod';

export const templateQuerySchema = z.object({
  category: z.string().optional(),
  platform: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const generateFromTemplateSchema = z.object({
  variables: z.record(z.string(), z.string()),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});
