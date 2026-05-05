import { z } from 'zod';

export const createStyleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional().default(''),
  samplePosts: z
    .array(z.string().min(1))
    .min(3, 'At least 3 sample posts are required')
    .max(20, 'Maximum 20 sample posts'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});

export const generateInStyleSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(2000),
  platform: z.string().min(1, 'Platform is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});
