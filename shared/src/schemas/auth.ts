import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

export const loginSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis'),
  confirmation: z.literal('DELETE'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
