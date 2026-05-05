import { z } from 'zod';

export const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000),
  platforms: z
    .array(
      z.enum([
        'linkedin',
        'twitter',
        'facebook',
        'instagram',
        'tiktok',
        'pinterest',
      ]),
    )
    .min(1, 'At least one platform is required'),
  tone: z.enum([
    'professional',
    'casual',
    'humorous',
    'inspirational',
    'educational',
    'persuasive',
    'storytelling',
    'provocative',
  ]),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  language: z.string().default('English'),
});

export const hooksSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(2000),
  platform: z.string().min(1, 'Platform is required'),
  tone: z.string().min(1, 'Tone is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  count: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export const carouselSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(5000),
  platform: z.string().min(1, 'Platform is required'),
  tone: z.string().min(1, 'Tone is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  slideCount: z.coerce.number().int().min(3).max(15).optional().default(7),
});

export const repurposeSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  sourcePlatform: z.string().min(1, 'Source platform is required'),
  targetPlatforms: z
    .array(z.string())
    .min(1, 'At least one target platform is required'),
  tone: z.string().min(1, 'Tone is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});

export const hashtagsSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(2000),
  platform: z.string().min(1, 'Platform is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  count: z.coerce.number().int().min(1).max(30).optional().default(15),
});

export const abTestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(5000),
  platform: z.string().min(1, 'Platform is required'),
  tone: z.string().min(1, 'Tone is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  variantCount: z.coerce.number().int().min(2).max(5).optional().default(3),
});
