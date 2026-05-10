import { z } from 'zod';

export const createPillarSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format')
    .optional(),
  topics: z.array(z.string()).optional(),
  postingFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  targetPlatforms: z.array(z.string()).optional(),
});

export const updatePillarSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format')
    .optional(),
  topics: z.array(z.string()).optional(),
  postingFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  targetPlatforms: z.array(z.string()).optional(),
});

export const createIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  status: z.enum(['idea', 'drafted', 'scheduled', 'published']).optional(),
  priority: z.coerce.number().int().min(0).max(10).optional(),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['idea', 'drafted', 'scheduled', 'published']).optional(),
  priority: z.coerce.number().int().min(0).max(10).optional(),
  postId: z.string().nullable().optional(),
});

export const generateIdeasSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  count: z.coerce.number().int().min(1).max(10).optional().default(5),
});
