import { generateText } from 'ai';
import type { LLMProviderId } from '@postcommander/shared';
import type { AssistFieldKey, AssistFieldResponse } from '@postcommander/shared';
import { createModel } from './provider-factory.js';
import { chatgptProGenerate, chatgptProAvailable } from './chatgpt-pro/sdk-wrapper.js';
import { config } from '../../config/env.js';

interface FieldPrompt {
  /** Short system prompt describing what to produce. */
  system: string;
  /** Builder for the user message — receives the context object passed by the client. */
  buildUser: (ctx: Record<string, unknown>, locale: string) => string;
  /** How many alternative suggestions to ask for. 0 = main only. */
  alternativesCount?: number;
}

const FIELD_PROMPTS: Record<AssistFieldKey, FieldPrompt> = {
  topic: {
    system:
      'Tu aides un créateur de contenu à choisir un sujet de post précis et engageant. Réponds en une phrase concrète, pas en liste, pas de meta-explications.',
    buildUser: (ctx, locale) => {
      const audience = (ctx.audience as string) || 'audience générale';
      const goal = (ctx.goal as string) || 'engagement';
      return `Langue de sortie: ${locale}. Audience cible: ${audience}. Objectif: ${goal}. Propose un sujet de post (1 phrase courte).`;
    },
    alternativesCount: 2,
  },
  audience: {
    system:
      "Tu aides à définir l'audience cible d'un post social. Réponds par une description courte (ex: 'Founders SaaS B2B, 30-45 ans, France').",
    buildUser: (ctx, locale) => {
      const topic = (ctx.topic as string) || '';
      return `Langue: ${locale}. Sujet: "${topic}". Décris l'audience idéale (1 phrase).`;
    },
    alternativesCount: 1,
  },
  tone: {
    system:
      "Tu suggères un ton adapté à un post. Réponds par un seul mot ou expression courte parmi: professionnel, conversationnel, inspirant, ironique, technique, didactique, provocateur, chaleureux.",
    buildUser: (ctx, _locale) => {
      const topic = (ctx.topic as string) || '';
      const audience = (ctx.audience as string) || '';
      return `Sujet: "${topic}". Audience: "${audience}". Quel ton?`;
    },
  },
  hook: {
    system:
      "Tu écris des accroches de posts sociaux. Réponds par UNE accroche courte (max 12 mots), sans guillemets, sans préfixe 'Voici'.",
    buildUser: (ctx, locale) => {
      const topic = (ctx.topic as string) || '';
      const audience = (ctx.audience as string) || '';
      return `Langue: ${locale}. Sujet: "${topic}". Audience: "${audience}". Écris une accroche.`;
    },
    alternativesCount: 2,
  },
  cta: {
    system:
      "Tu suggères un call-to-action court pour un post social. Réponds par UNE phrase d'action (max 10 mots).",
    buildUser: (ctx, locale) => {
      const goal = (ctx.goal as string) || 'engagement';
      return `Langue: ${locale}. Objectif: ${goal}. Écris un CTA court.`;
    },
    alternativesCount: 2,
  },
  goal: {
    system:
      "Tu suggères un objectif marketing concret pour un post. Réponds par un seul mot parmi: awareness, engagement, leads, sales, recrutement, education.",
    buildUser: (ctx, _locale) => {
      const topic = (ctx.topic as string) || '';
      return `Sujet: "${topic}". Objectif principal?`;
    },
  },
  icp_industry: {
    system:
      "Tu aides à définir l'ICP (Ideal Customer Profile) d'une campagne outreach. Réponds par le nom d'une industrie précise (ex: 'SaaS B2B', 'Cabinets comptables', 'E-commerce mode').",
    buildUser: (ctx, _locale) => {
      const product = (ctx.product as string) || (ctx.topic as string) || '';
      return `Produit/Service: "${product}". Quelle industrie cibler en priorité?`;
    },
    alternativesCount: 2,
  },
  icp_role: {
    system:
      "Tu suggères un rôle/titre cible pour une campagne outreach. Réponds par un titre de poste précis (ex: 'Head of Growth', 'CTO', 'Directeur Marketing').",
    buildUser: (ctx, _locale) => {
      const industry = (ctx.industry as string) || (ctx.icp_industry as string) || '';
      const product = (ctx.product as string) || '';
      return `Industrie: "${industry}". Produit: "${product}". Quel rôle viser?`;
    },
    alternativesCount: 2,
  },
  icp_region: {
    system:
      'Tu suggères une région géographique pour une campagne outreach. Réponds par un nom de région ou pays.',
    buildUser: (ctx, _locale) => {
      const industry = (ctx.industry as string) || '';
      return `Industrie: "${industry}". Quelle région cibler?`;
    },
    alternativesCount: 1,
  },
  outreach_message: {
    system:
      "Tu écris des messages d'outreach LinkedIn/email. Style: court (max 4 phrases), personnalisé, pas de salutation type 'J'espère que tu vas bien'. Commence directement par une observation pertinente.",
    buildUser: (ctx, locale) => {
      const icp = JSON.stringify({
        industry: ctx.icp_industry || ctx.industry,
        role: ctx.icp_role || ctx.role,
        region: ctx.icp_region || ctx.region,
      });
      const product = (ctx.product as string) || '';
      return `Langue: ${locale}. ICP: ${icp}. Produit à promouvoir: "${product}". Écris un message d'outreach (4 phrases max).`;
    },
    alternativesCount: 1,
  },
  blog_title: {
    system:
      "Tu écris des titres de blog optimisés. Réponds par UN titre (max 70 caractères), accrocheur, sans guillemets.",
    buildUser: (ctx, locale) => {
      const topic = (ctx.topic as string) || (ctx.blog_topic as string) || '';
      return `Langue: ${locale}. Sujet: "${topic}". Écris un titre.`;
    },
    alternativesCount: 2,
  },
  blog_outline: {
    system:
      "Tu rédiges des plans d'articles de blog. Réponds par 4-6 sections sous forme de liste à puces, une ligne par section.",
    buildUser: (ctx, locale) => {
      const title = (ctx.title as string) || (ctx.blog_title as string) || '';
      const topic = (ctx.topic as string) || '';
      return `Langue: ${locale}. Titre: "${title}". Sujet: "${topic}". Donne le plan.`;
    },
  },
  blog_topic: {
    system:
      "Tu aides à choisir un sujet d'article de blog. Réponds par une formulation courte (1 phrase) du sujet.",
    buildUser: (ctx, locale) => {
      const audience = (ctx.audience as string) || '';
      const niche = (ctx.niche as string) || (ctx.industry as string) || '';
      return `Langue: ${locale}. Audience: "${audience}". Niche: "${niche}". Sujet d'article?`;
    },
    alternativesCount: 2,
  },
};

interface SuggestParams {
  field: AssistFieldKey;
  context: Record<string, unknown>;
  locale: string;
  userId: string;
  provider?: LLMProviderId;
  model?: string;
}

/**
 * Pick a usable LLM provider+model when the client did not specify one.
 * Priority: connected ChatGPT Pro → env-configured key (cheap fast model) → ollama.
 */
async function pickDefaultProviderModel(
  userId: string,
): Promise<{ provider: LLMProviderId; model: string }> {
  if (await chatgptProAvailable(userId)) return { provider: 'chatgpt-pro', model: 'gpt-5' };
  if (config.OPENAI_API_KEY) return { provider: 'openai', model: 'gpt-4o-mini' };
  if (config.ANTHROPIC_API_KEY)
    return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' };
  if (config.GOOGLE_GENERATIVE_AI_API_KEY)
    return { provider: 'google', model: 'gemini-2.0-flash' };
  if (config.MISTRAL_API_KEY) return { provider: 'mistral', model: 'mistral-small-latest' };
  return { provider: 'ollama', model: 'llama3.3' };
}

export async function suggestFieldValue(params: SuggestParams): Promise<AssistFieldResponse> {
  const prompt = FIELD_PROMPTS[params.field];
  if (!prompt) {
    throw new Error(`Unknown assist field: ${params.field}`);
  }

  const fallback = await pickDefaultProviderModel(params.userId);
  const provider = (params.provider || fallback.provider) as LLMProviderId;
  const model = params.model || fallback.model;

  const altCount = prompt.alternativesCount ?? 0;
  const totalToGenerate = 1 + altCount;
  const userMessage =
    totalToGenerate === 1
      ? prompt.buildUser(params.context, params.locale)
      : `${prompt.buildUser(params.context, params.locale)}\n\nDonne ${totalToGenerate} variantes, une par ligne, numérotées 1) 2) 3).`;

  let text: string;
  if (provider === 'chatgpt-pro') {
    text = (
      await chatgptProGenerate({
        userId: params.userId,
        model,
        system: prompt.system,
        prompt: userMessage,
      })
    ).trim();
  } else {
    const llm = await createModel(provider, model, params.userId);
    const result = await generateText({
      model: llm,
      system: prompt.system,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.85,
      maxTokens: 250,
    });
    text = result.text.trim();
  }

  if (totalToGenerate === 1) {
    return { suggestion: cleanSuggestion(text) };
  }

  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim())
    .map(cleanSuggestion)
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { suggestion: cleanSuggestion(text) };
  }

  const [main, ...rest] = lines;
  return {
    suggestion: main,
    alternatives: rest.slice(0, altCount),
  };
}

function cleanSuggestion(s: string): string {
  return s
    .replace(/^["«»'`]+|["«»'`]+$/g, '')
    .replace(/^Voici\s+(une|un|le|la|les)\s+/i, '')
    .trim();
}
