import { z } from 'zod';

export const postStatusSchema = z.enum(['draft', 'needs_approval', 'approved', 'rejected', 'scheduled', 'published', 'failed']);

export const createPostSchema = z.object({
  content: z.string().min(1, 'Contenu requis'),
  originalPrompt: z.string().optional().default(''),
  tone: z.string().optional().default('professional'),
  llmProvider: z.string().optional().default(''),
  llmModel: z.string().optional().default(''),
  platforms: z.array(z.string()).min(1, 'Au moins une plateforme est requise'),
  platformVariants: z.record(z.string(), z.string()).optional().default({}),
  hashtags: z.array(z.string()).optional().default([]),
  status: postStatusSchema.optional().default('draft'),
  scheduledAt: z.string().nullable().optional().default(null),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).optional(),
  originalPrompt: z.string().optional(),
  tone: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  platformVariants: z.record(z.string(), z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  status: postStatusSchema.optional(),
  scheduledAt: z.string().nullable().optional(),
});

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  status: postStatusSchema.optional(),
  search: z.string().optional(),
});

export const publishPostSchema = z.object({
  platforms: z
    .array(z.enum(['linkedin', 'twitter', 'facebook', 'instagram', 'tiktok', 'pinterest']))
    .min(1, 'Au moins une plateforme est requise'),
});

export const schedulePostSchema = z.object({
  scheduledAt: z.string().min(1, 'La date de programmation est requise'),
});

export const repurposeUrlSchema = z.object({
  url: z.string().url('Doit être une URL valide'),
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
});
