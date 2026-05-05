import { z } from 'zod';

export const updateSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  mistralApiKey: z.string().optional(),
  ollamaBaseUrl: z.string().optional(),
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
  defaultTone: z.string().optional(),
  defaultLanguage: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
