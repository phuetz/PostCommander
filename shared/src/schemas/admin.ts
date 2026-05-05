import { z } from 'zod';

export const deletedAccountsQuerySchema = z
  .object({
    email: z.string().email().optional(),
    originalUserId: z.string().min(1).optional(),
    stripeCustomerId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .refine(
    (value) => {
      const filters = [value.email, value.originalUserId, value.stripeCustomerId].filter(Boolean);
      return filters.length <= 1 || filters.every((entry) => typeof entry === 'string');
    },
    {
      message: 'Provide at most one deleted account search filter per request.',
    },
  );

export type DeletedAccountsQuery = z.infer<typeof deletedAccountsQuerySchema>;
