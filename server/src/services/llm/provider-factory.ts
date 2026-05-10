import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOllama } from 'ollama-ai-provider';
import type { LanguageModelV1 } from 'ai';
import type { LLMProviderId } from '@postcommander/shared';
import { config } from '../../config/env.js';
import { getDb } from '../../db/connection.js';
import type { ProviderConfig } from './types.js';
import { decryptSecret } from '../../utils/secret-crypto.js';

/**
 * Retrieve an API key: first check env vars, then fall back to the settings DB.
 */
function getApiKey(settingKey: string, userId?: string, envValue?: string): string | undefined {
  if (envValue) return envValue;
  if (!userId) return undefined;

  try {
    const db = getDb();
    const row = db
      .prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?')
      .get(userId, settingKey) as { value: string } | undefined;
    return decryptSecret(row?.value);
  } catch {
    return undefined;
  }
}

function getSettingValue(key: string, userId?: string): string | undefined {
  if (!userId) return undefined;

  try {
    const db = getDb();
    const row = db
      .prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?')
      .get(userId, key) as { value: string } | undefined;
    return row?.value;
  } catch {
    return undefined;
  }
}

/**
 * Build provider configuration by merging env vars and DB settings.
 */
function getProviderConfig(providerId: LLMProviderId, userId?: string): ProviderConfig {
  switch (providerId) {
    case 'openai':
      return {
        apiKey: getApiKey('openaiApiKey', userId, config.OPENAI_API_KEY),
      };
    case 'anthropic':
      return {
        apiKey: getApiKey('anthropicApiKey', userId, config.ANTHROPIC_API_KEY),
      };
    case 'google':
      return {
        apiKey: getApiKey('googleApiKey', userId, config.GOOGLE_GENERATIVE_AI_API_KEY),
      };
    case 'mistral':
      return {
        apiKey: getApiKey('mistralApiKey', userId, config.MISTRAL_API_KEY),
      };
    case 'ollama':
      return {
        baseUrl: getSettingValue('ollamaBaseUrl', userId) || config.OLLAMA_BASE_URL,
      };
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

/**
 * Create a Vercel AI SDK language model instance for the given provider and model.
 */
export function createModel(
  providerId: LLMProviderId,
  modelId: string,
  userId?: string,
): LanguageModelV1 {
  const providerConfig = getProviderConfig(providerId, userId);

  switch (providerId) {
    case 'openai': {
      if (!providerConfig.apiKey) {
        throw new Error(
          'OpenAI API key not configured. Set OPENAI_API_KEY env var or configure in Settings.',
        );
      }
      const openai = createOpenAI({ apiKey: providerConfig.apiKey });
      return openai(modelId);
    }
    case 'anthropic': {
      if (!providerConfig.apiKey) {
        throw new Error(
          'Anthropic API key not configured. Set ANTHROPIC_API_KEY env var or configure in Settings.',
        );
      }
      const anthropic = createAnthropic({ apiKey: providerConfig.apiKey });
      return anthropic(modelId);
    }
    case 'google': {
      if (!providerConfig.apiKey) {
        throw new Error(
          'Google API key not configured. Set GOOGLE_GENERATIVE_AI_API_KEY env var or configure in Settings.',
        );
      }
      const google = createGoogleGenerativeAI({
        apiKey: providerConfig.apiKey,
      });
      return google(modelId);
    }
    case 'mistral': {
      if (!providerConfig.apiKey) {
        throw new Error(
          'Mistral API key not configured. Set MISTRAL_API_KEY env var or configure in Settings.',
        );
      }
      const mistral = createMistral({ apiKey: providerConfig.apiKey });
      return mistral(modelId);
    }
    case 'ollama': {
      const ollama = createOllama({
        baseURL: providerConfig.baseUrl || 'http://localhost:11434/api',
      });
      return ollama(modelId);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${providerId}`);
  }
}
