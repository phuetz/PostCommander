import { generateText, streamText } from 'ai';
import { createModel } from './provider-factory.js';
import { buildPrompts, buildStreamingPrompts, buildVariantsPrompt } from './prompts.js';
import type { LLMGenerateRequest, LLMGenerateResult, LLMStreamChunk, LLMBlogGenerateRequest } from './types.js';
import { chatgptProGenerate } from './chatgpt-pro/sdk-wrapper.js';

/**
 * Parse a JSON string that may contain markdown code fences.
 */
function parseJsonResponse(text: string): any {
  // Strip potential markdown code fences
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Generate a complete social media post with platform variants (non-streaming).
 */
export async function generatePost(
  request: LLMGenerateRequest,
  userId?: string,
): Promise<LLMGenerateResult> {
  const { system, user } = buildPrompts({
    prompt: request.prompt,
    platforms: request.platforms,
    tone: request.tone,
    language: request.language,
  });

  let rawText: string;
  if (request.provider === 'chatgpt-pro') {
    if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
    rawText = await chatgptProGenerate({ userId, model: request.model, system, prompt: user });
  } else {
    const model = createModel(request.provider, request.model, userId);
    const result = await generateText({
      model,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.7,
      maxTokens: 2048,
    });
    rawText = result.text;
  }

  const parsed = parseJsonResponse(rawText);

  return {
    content: parsed.content ?? '',
    platformVariants: parsed.platformVariants ?? {},
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
  };
}

/**
 * Stream a social media post, then generate variants.
 * Calls onChunk for each piece of streaming data (SSE-friendly).
 */
export async function streamPost(
  request: LLMGenerateRequest,
  userId: string | undefined,
  onChunk: (chunk: LLMStreamChunk) => void,
): Promise<LLMGenerateResult> {
  // Phase 1: Stream the main content
  const { system, user } = buildStreamingPrompts({
    prompt: request.prompt,
    platforms: request.platforms,
    tone: request.tone,
    language: request.language,
  });

  let mainContent = '';

  if (request.provider === 'chatgpt-pro') {
    if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
    mainContent = await chatgptProGenerate({
      userId,
      model: request.model,
      system,
      prompt: user,
      onTextDelta: (delta) => {
        onChunk({ type: 'text-delta', content: delta });
      },
    });
  } else {
    const model = createModel(request.provider, request.model, userId);
    const streamResult = streamText({
      model,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.7,
      maxTokens: 1024,
    });
    for await (const chunk of (await streamResult).textStream) {
      mainContent += chunk;
      onChunk({ type: 'text-delta', content: chunk });
    }
  }

  // Phase 2: Generate platform variants (non-streaming)
  const variantsPrompts = buildVariantsPrompt({
    mainContent,
    platforms: request.platforms,
    tone: request.tone,
  });

  let variantsText: string;
  if (request.provider === 'chatgpt-pro') {
    if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
    variantsText = await chatgptProGenerate({
      userId,
      model: request.model,
      system: variantsPrompts.system,
      prompt: variantsPrompts.user,
    });
  } else {
    const model = createModel(request.provider, request.model, userId);
    const variantsResult = await generateText({
      model,
      system: variantsPrompts.system,
      messages: [{ role: 'user', content: variantsPrompts.user }],
      temperature: 0.5,
      maxTokens: 2048,
    });
    variantsText = variantsResult.text;
  }
  // Synthesize a result object compatible with the existing variants parser below.
  const variantsResult = { text: variantsText };

  let platformVariants: Record<string, string> = {};
  let hashtags: string[] = [];

  try {
    const parsed = parseJsonResponse(variantsResult.text);
    platformVariants = parsed.platformVariants ?? {};
    hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  } catch {
    // If parsing fails, use the main content for all platforms
    for (const pid of request.platforms) {
      platformVariants[pid] = mainContent;
    }
  }

  // Send variant chunks
  for (const [platform, variant] of Object.entries(platformVariants)) {
    onChunk({ type: 'platform-variant', platform, content: variant });
  }

  // Send hashtags
  onChunk({ type: 'hashtags', hashtags });

  // Done
  onChunk({ type: 'done' });

  return {
    content: mainContent,
    platformVariants,
    hashtags,
  };
}

/**
 * Generate a long-form blog article based on the custom prompt strategy.
 */
export async function generateBlogArticle(
  request: LLMBlogGenerateRequest,
  userId?: string,
): Promise<{ content: string }> {
  const { buildBlogArticlePrompt } = await import('../ai/blog-prompts.js');

  const system =
    'You are an expert technical blog writer following specific stylistic constraints.';
  const prompt = buildBlogArticlePrompt({
    topic: request.topic,
    articleType: request.articleType,
    authorName: request.authorName,
    authorRole: request.authorRole,
    authorContext: request.authorContext,
    authorReferences: request.authorReferences,
    catalogMatched: request.catalogMatched,
    similarSources: request.similarSources,
    language: request.language,
  });

  if (request.provider === 'chatgpt-pro') {
    if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
    const content = await chatgptProGenerate({
      userId,
      model: request.model,
      system,
      prompt,
    });
    return { content };
  }

  const model = createModel(request.provider, request.model, userId);
  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 4000, // Blog articles are longer
  });

  return {
    content: result.text,
  };
}
