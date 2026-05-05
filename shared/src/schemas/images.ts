import { z } from 'zod';

export const generateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4000),
  provider: z.string().optional().default('openai'),
  postId: z.string().optional(),
});

export const listImagesQuerySchema = z.object({
  postId: z.string().optional(),
});

export const updateImageSchema = z.object({
  postId: z.string().nullable().optional(),
});

export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type ListImagesQuery = z.infer<typeof listImagesQuerySchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
