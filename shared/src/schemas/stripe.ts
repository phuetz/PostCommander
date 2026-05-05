import { z } from 'zod';

export const createCheckoutSchema = z.object({
  plan: z.enum(['pro', 'business']),
  interval: z.enum(['month', 'year']),
});

export const createPortalSchema = z.object({});
export const emailBodySchema = z.object({});
export const emailQuerySchema = z.object({});
