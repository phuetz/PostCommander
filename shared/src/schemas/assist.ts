import { z } from 'zod';

export const ASSIST_FIELD_KEYS = [
  'topic',
  'audience',
  'tone',
  'hook',
  'cta',
  'goal',
  'icp_industry',
  'icp_role',
  'icp_region',
  'outreach_message',
  'blog_title',
  'blog_outline',
  'blog_topic',
] as const;

export type AssistFieldKey = (typeof ASSIST_FIELD_KEYS)[number];

export const assistFieldRequestSchema = z.object({
  field: z.enum(ASSIST_FIELD_KEYS),
  context: z.record(z.string(), z.unknown()).optional().default({}),
  locale: z.string().min(2).max(10).optional().default('fr'),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export type AssistFieldRequest = z.infer<typeof assistFieldRequestSchema>;

export interface AssistFieldResponse {
  suggestion: string;
  alternatives?: string[];
}
