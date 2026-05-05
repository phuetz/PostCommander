import { z } from 'zod';

export const engagementSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  platform: z.string().min(1, 'Platform is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});

export const simulateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  platform: z.string().min(1, 'Platform is required'),
  audience: z.string().max(500).optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});

export type EngagementInput = z.infer<typeof engagementSchema>;
export type SimulateInput = z.infer<typeof simulateSchema>;
