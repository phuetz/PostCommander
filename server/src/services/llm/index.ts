import { generateText, streamText } from 'ai';
import { createModel } from './provider-factory.js';
import { buildPrompts, buildStreamingPrompts, buildVariantsPrompt } from './prompts.js';
import type { LLMGenerateRequest, LLMGenerateResult, LLMStreamChunk, LLMBlogGenerateRequest } from './types.js';
import { enrichPromptWithUrls } from '../../utils/scraper.js';
import { generateJsonWithRetry } from '../../utils/llm-retry.js';
import { chatgptProGenerate } from './chatgpt-pro/sdk-wrapper.js';

/**
 * Generate a complete social media post with platform variants (non-streaming).
 */
export async function generatePost(
  request: LLMGenerateRequest,
  userId?: string,
): Promise<LLMGenerateResult> {
  // --- Multi-Agent Pipeline (Non-streaming) ---
  const enrichedPrompt = await enrichPromptWithUrls(request.prompt);
  const model = createModel(request.provider, request.model, userId);

  // Agent 1: Researcher
  const researcherSystem = `You are an expert social media researcher and strategist.
Your job is to analyze the user's prompt and extract key arguments, a structural outline, and 3 viral hook ideas.
Write in: ${request.language || 'English'}
Keep it concise and factual.`;
  const researcherResult = await generateText({
    model,
    system: researcherSystem,
    messages: [{ role: 'user', content: enrichedPrompt }],
    temperature: 0.7,
    maxTokens: 500,
  });
  const research = researcherResult.text;

  // Agent 2: Writer
  const writerSystem = `You are a talented social media copywriter.
Use the following research to write a highly engaging initial draft for ${request.platforms.join(', ')}.
Tone: ${request.tone}
Language: ${request.language || 'English'}
Do NOT use hashtags. Focus purely on writing an amazing draft.`;
  const writerResult = await generateText({
    model,
    system: writerSystem,
    messages: [
      { role: 'user', content: `Topic: ${enrichedPrompt}\n\nResearch:\n${research}` }
    ],
    temperature: 0.7,
    maxTokens: 800,
  });
  const draft = writerResult.text;

  // Agent 3: Editor
  const { system, user } = buildPrompts({
    prompt: enrichedPrompt,
    platforms: request.platforms,
    tone: request.tone,
    language: request.language,
  });

  const editorUser = `${user}\n\nHere is the initial draft to improve and polish. Output the final JSON format based on this draft:\n${draft}`;

  const parsed = await generateJsonWithRetry<any>(
    async (currentPrompt) => {
      if (request.provider === 'chatgpt-pro') {
        if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
        return chatgptProGenerate({ userId, model: request.model, system, prompt: currentPrompt });
      } else {
        const result = await generateText({
          model,
          system,
          messages: [{ role: 'user', content: currentPrompt }],
          temperature: 0.7,
          maxTokens: 2048,
        });
        return result.text;
      }
    },
    editorUser
  );

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
  // --- Multi-Agent Pipeline ---
  const enrichedPrompt = await enrichPromptWithUrls(request.prompt);
  const model = createModel(request.provider, request.model, userId);

  // Agent 1: Researcher
  onChunk({ type: 'agent-status', content: '🕵️ L\'Agent Chercheur rassemble des informations et idées...' });
  const researcherSystem = `You are an expert social media researcher and strategist.
Your job is to analyze the user's prompt and extract key arguments, a structural outline, and 3 viral hook ideas.
Write in: ${request.language || 'English'}
Keep it concise and factual.`;
  const researcherResult = await generateText({
    model,
    system: researcherSystem,
    messages: [{ role: 'user', content: enrichedPrompt }],
    temperature: 0.7,
    maxTokens: 500,
  });
  const research = researcherResult.text;

  // Agent 2: Writer
  onChunk({ type: 'agent-status', content: '✍️ L\'Agent Rédacteur écrit le brouillon initial...' });
  const writerSystem = `You are a talented social media copywriter.
Use the following research to write a highly engaging initial draft for ${request.platforms.join(', ')}.
Tone: ${request.tone}
Language: ${request.language || 'English'}
Do NOT use hashtags. Focus purely on writing an amazing draft.`;
  const writerResult = await generateText({
    model,
    system: writerSystem,
    messages: [
      { role: 'user', content: `Topic: ${enrichedPrompt}\n\nResearch:\n${research}` }
    ],
    temperature: 0.7,
    maxTokens: 800,
  });
  const draft = writerResult.text;

  // Agent 3: Editor (Streaming)
  onChunk({ type: 'agent-status', content: '🧐 L\'Agent Éditeur polit la version finale...' });
  const { system, user } = buildStreamingPrompts({
    prompt: enrichedPrompt,
    platforms: request.platforms,
    tone: request.tone,
    language: request.language,
  });

  const editorUser = `${user}\n\nHere is the initial draft to improve and polish:\n${draft}`;

  let mainContent = '';

  if (request.provider === 'chatgpt-pro') {
    if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
    mainContent = await chatgptProGenerate({
      userId,
      model: request.model,
      system,
      prompt: editorUser,
      onTextDelta: (delta) => {
        onChunk({ type: 'text-delta', content: delta });
      },
    });
  } else {
    const streamResult = streamText({
      model,
      system,
      messages: [{ role: 'user', content: editorUser }],
      temperature: 0.7,
      maxTokens: 1024,
    });
    for await (const chunk of (await streamResult).textStream) {
      mainContent += chunk;
      onChunk({ type: 'text-delta', content: chunk });
    }
  }

  onChunk({ type: 'agent-status', content: '✨ Génération des déclinaisons par plateforme...' });

  // Phase 2: Generate platform variants (non-streaming)
  const variantsPrompts = buildVariantsPrompt({
    mainContent,
    platforms: request.platforms,
    tone: request.tone,
  });

  let platformVariants: Record<string, string> = {};
  let hashtags: string[] = [];

  try {
    const parsed = await generateJsonWithRetry<any>(
      async (currentPrompt) => {
        if (request.provider === 'chatgpt-pro') {
          if (!userId) throw new Error('ChatGPT Pro requires a logged-in user');
          return chatgptProGenerate({
            userId,
            model: request.model,
            system: variantsPrompts.system,
            prompt: currentPrompt,
          });
        } else {
          const variantsModel = createModel(request.provider, request.model, userId);
          const variantsResult = await generateText({
            model: variantsModel,
            system: variantsPrompts.system,
            messages: [{ role: 'user', content: currentPrompt }],
            temperature: 0.5,
            maxTokens: 2048,
          });
          return variantsResult.text;
        }
      },
      variantsPrompts.user
    );

    platformVariants = parsed.platformVariants ?? {};
    hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  } catch (error) {
    // If self-healing fails completely, use the main content for all platforms
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
