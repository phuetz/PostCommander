import { generateText, streamText } from 'ai';
import { createModel } from './provider-factory.js';
import { buildPrompts, buildStreamingPrompts, buildVariantsPrompt } from './prompts.js';
import type { LLMGenerateRequest, LLMGenerateResult, LLMStreamChunk } from './types.js';

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
  const model = createModel(request.provider, request.model, userId);
  const { system, user } = buildPrompts({
    prompt: request.prompt,
    platforms: request.platforms,
    tone: request.tone,
    language: request.language,
  });

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.7,
    maxTokens: 2048,
  });

  const parsed = parseJsonResponse(result.text);

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
  const model = createModel(request.provider, request.model, userId);

  // Phase 1: Stream the main content
  const { system, user } = buildStreamingPrompts({
    prompt: request.prompt,
    platforms: request.platforms,
    tone: request.tone,
    language: request.language,
  });

  let mainContent = '';

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

  // Phase 2: Generate platform variants (non-streaming)
  const variantsPrompts = buildVariantsPrompt({
    mainContent,
    platforms: request.platforms,
    tone: request.tone,
  });

  const variantsResult = await generateText({
    model,
    system: variantsPrompts.system,
    messages: [{ role: 'user', content: variantsPrompts.user }],
    temperature: 0.5,
    maxTokens: 2048,
  });

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
  request: any, // using any for now to avoid strict typing issues with the newly added schema fields
  userId?: string,
): Promise<{ content: string }> {
  const { buildBlogArticlePrompt } = await import('../ai/blog-prompts.js');

  const model = createModel(request.provider, request.model, userId);

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

  const result = await generateText({
    model,
    system: 'You are an expert technical blog writer following specific stylistic constraints.',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 4000, // Blog articles are longer
  });

  return {
    content: result.text,
  };
}
