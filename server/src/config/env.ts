import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load monorepo root .env first, then server-local .env (server-local wins on collision).
// __dirname is server/src/config (dev) or server/dist/config (prod) — both 2 levels under server/.
const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(SERVER_ROOT, '..');
dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(SERVER_ROOT, '.env'), override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('supersecretdevkey'),
  ENCRYPTION_KEY: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  DEV_AUTO_LOGIN_EMAIL: z.string().email().optional(),

  // Optional API keys — can also be set via Settings UI and stored in DB
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  MEM0_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),

  // OAuth credentials — optional until platform connections are configured
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  PINTEREST_APP_ID: z.string().optional(),
  PINTEREST_APP_SECRET: z.string().optional(),

  // Base URL for OAuth callbacks
  BASE_URL: z.string().default('http://localhost:3001'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_BUSINESS_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().default('http://localhost:5173/app/billing?success=true'),
  STRIPE_CANCEL_URL: z.string().default('http://localhost:5173/pricing'),

  // Password reset delivery
  PASSWORD_RESET_WEBHOOK_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default('PostCommander <noreply@postcommander.app>'),

  // Stagehand Outreach
  LINKEDIN_SESSION_COOKIE: z.string().optional(),
  OUTREACH_DRY_RUN: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  BROWSERBASE_API_KEY: z.string().optional(),
  BROWSERBASE_PROJECT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

import { logger } from '../utils/logger.js';

if (!parsed.success) {
  logger.fatal({ errors: parsed.error.flatten().fieldErrors }, 'Invalid environment variables');
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET === 'supersecretdevkey') {
  logger.fatal('JWT_SECRET must be explicitly configured in production');
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.ENCRYPTION_KEY) {
  logger.fatal('ENCRYPTION_KEY must be explicitly configured in production');
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;
