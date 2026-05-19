import { generateText } from 'ai';
import type { ZodSchema } from 'zod';
import type { LLMProviderId } from '@postcommander/shared';
import { createModel } from './provider-factory.js';
import { logger } from '../../utils/logger.js';

/**
 * Strip ```json / ``` code fences that LLMs love to wrap JSON in. Tolerant —
 * if the input is already plain JSON or has no fence, returns parsed value.
 * Throws if the inner content isn't valid JSON.
 */
export function parseJsonResponse<T = unknown>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}

export interface RunLLMOptions<T = unknown> {
  provider: LLMProviderId;
  model: string;
  /** When provided, user-stored API keys (from `settings` table) override env keys. */
  userId?: string;
  system: string;
  user: string;
  /** Default 0.7 — override per use case. */
  temperature?: number;
  /** Default 2048. */
  maxTokens?: number;
  /** If set, the LLM output is parsed as JSON and validated against this Zod schema. */
  schema?: ZodSchema<T>;
  /**
   * Number of retries on transient errors (network, JSON parse fail when
   * schema set, schema validation fail). Default 1 (= 2 total attempts).
   */
  retries?: number;
}

export interface RunLLMResult<T> {
  /** Parsed value if `schema` was provided, otherwise the raw text. */
  data: T;
  /** Raw text response (kept for debugging / logging). */
  raw: string;
  attempts: number;
}

/**
 * Single entry point for every LLM call in PostCommander. Centralizes:
 *   - per-user API key resolution (via createModel(provider, model, userId))
 *   - JSON parsing + optional Zod validation
 *   - retry on transient JSON/schema/network errors with exponential backoff
 *   - structured logging on failure (provider, model, attempt, sanitized error)
 *
 * Migrate existing services/llm/*.ts callers incrementally — wrapper is opt-in.
 *
 * @example
 *   const { data } = await runLLM({
 *     provider: 'openai', model: 'gpt-4o', userId,
 *     system: '...', user: '...',
 *     schema: z.object({ hooks: z.array(z.string()) }),
 *   });
 */
export async function runLLM<T = string>(opts: RunLLMOptions<T>): Promise<RunLLMResult<T>> {
  const maxAttempts = (opts.retries ?? 1) + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const model = await createModel(opts.provider, opts.model, opts.userId);
      const result = await generateText({
        model,
        system: opts.system,
        messages: [{ role: 'user', content: opts.user }],
        temperature: opts.temperature ?? 0.7,
        maxTokens: opts.maxTokens ?? 2048,
      });

      if (!opts.schema) {
        return { data: result.text as unknown as T, raw: result.text, attempts: attempt };
      }

      const parsed = parseJsonResponse<unknown>(result.text);
      const validated = opts.schema.parse(parsed);
      return { data: validated, raw: result.text, attempts: attempt };
    } catch (err) {
      lastError = err;
      const isLast = attempt === maxAttempts;
      logger.warn(
        {
          provider: opts.provider,
          model: opts.model,
          attempt,
          maxAttempts,
          err: err instanceof Error ? err.message : String(err),
        },
        `[runLLM] attempt ${attempt}/${maxAttempts} failed${isLast ? ' (final)' : ' — retrying'}`,
      );
      if (!isLast) {
        // Exponential backoff: 500ms, 1s, 2s, …
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`runLLM failed after ${maxAttempts} attempts`);
}
