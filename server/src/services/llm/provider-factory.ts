import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOllama } from 'ollama-ai-provider';
import type { LanguageModelV1 } from 'ai';
import type { LLMProviderId } from '@postcommander/shared';
import { config } from '../../config/env.js';
import { getDrizzle } from '../../db/connection.js';
import { settings as settingsTable } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import type { ProviderConfig } from './types.js';
import { decryptSecret } from '../../utils/secret-crypto.js';

async function getApiKey(settingKey: string, userId?: string, envValue?: string): Promise<string | undefined> {
  if (envValue) return envValue;
  if (!userId) return undefined;

  try {
    const db = getDrizzle();
    const [row] = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, settingKey)))
      .limit(1);
    return decryptSecret(row?.value);
  } catch {
    return undefined;
  }
}

async function getSettingValue(key: string, userId?: string): Promise<string | undefined> {
  if (!userId) return undefined;

  try {
    const db = getDrizzle();
    const [row] = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, key)))
      .limit(1);
    return row?.value;
  } catch {
    return undefined;
  }
}

async function getProviderConfig(providerId: LLMProviderId, userId?: string): Promise<ProviderConfig> {
  switch (providerId) {
    case 'openai':
      return {
        apiKey: await getApiKey('openaiApiKey', userId, config.OPENAI_API_KEY),
      };
    case 'anthropic':
      return {
        apiKey: await getApiKey('anthropicApiKey', userId, config.ANTHROPIC_API_KEY),
      };
    case 'google':
      return {
        apiKey: await getApiKey('googleApiKey', userId, config.GOOGLE_GENERATIVE_AI_API_KEY),
      };
    case 'mistral':
      return {
        apiKey: await getApiKey('mistralApiKey', userId, config.MISTRAL_API_KEY),
      };
    case 'ollama':
      return {
        baseUrl: await getSettingValue('ollamaBaseUrl', userId) || config.OLLAMA_BASE_URL,
      };
    case 'chatgpt-pro':
      return {};
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

export async function createModel(
  providerId: LLMProviderId,
  modelId: string,
  userId?: string,
): Promise<LanguageModelV1> {
  const providerConfig = await getProviderConfig(providerId, userId);

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
    case 'chatgpt-pro':
      throw new Error(
        'ChatGPT Pro provider uses its own client. Call chatgptProGenerate() directly instead of createModel().',
      );
    default:
      throw new Error(`Unsupported LLM provider: ${providerId}`);
  }
}
