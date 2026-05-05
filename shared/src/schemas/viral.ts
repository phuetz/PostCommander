import { z } from 'zod';

export const viralQuerySchema = z.object({
  platform: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const viralSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});
