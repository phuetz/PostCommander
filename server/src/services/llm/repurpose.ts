import { generateText } from 'ai';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface RepurposeRequest {
  content: string;
  sourcePlatform: string;
  targetPlatforms: string[];
  tone: string;
  provider: LLMProviderId;
  model: string;
}

export interface RepurposeVariant {
  content: string;
  hashtags: string[];
}

export interface RepurposeResult {
  variants: Record<string, RepurposeVariant>;
}

function parseJsonResponse(text: string): any {
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

const PLATFORM_SPECS: Record<
  string,
  { name: string; charLimit: number; hashtagStyle: string; formatting: string }
> = {
  linkedin: {
    name: 'LinkedIn',
    charLimit: 3000,
    hashtagStyle: '3-5 professional hashtags at the end',
    formatting:
      'Use line breaks for readability. Professional but engaging. Can use bullet points and numbered lists. Opening line is critical for "see more" click. Emojis are acceptable but used sparingly.',
  },
  twitter: {
    name: 'Twitter/X',
    charLimit: 280,
    hashtagStyle: '1-3 hashtags max, integrated naturally or at the end',
    formatting:
      'Concise and punchy. One core idea. Use line breaks sparingly. No bullet points. Strong opinion or insight. Can break into a thread if needed but single tweet is preferred.',
  },
  instagram: {
    name: 'Instagram',
    charLimit: 2200,
    hashtagStyle: '20-30 hashtags in a separate block below the caption',
    formatting:
      'Conversational and visual. Start with a hook. Use emojis as bullet points or emphasis. Include a call to action (save, share, comment). Storytelling works well.',
  },
  facebook: {
    name: 'Facebook',
    charLimit: 63206,
    hashtagStyle: '2-5 hashtags, optional',
    formatting:
      'Conversational and shareable. Questions drive engagement. Medium length. Personal stories resonate. Encourage comments and shares.',
  },
  tiktok: {
    name: 'TikTok',
    charLimit: 4000,
    hashtagStyle: '3-5 trending + niche hashtags',
    formatting:
      'Casual, trendy, and hook-driven. Use trending language and formats. Short sentences. Direct address to viewer. Energy and personality matter.',
  },
  pinterest: {
    name: 'Pinterest',
    charLimit: 500,
    hashtagStyle: '2-5 keyword-rich hashtags',
    formatting:
      'SEO-focused and descriptive. Use keywords naturally. Describe what the content offers. Aspirational and actionable.',
  },
};

/**
 * Repurpose content from one platform to multiple target platforms.
 */
export async function repurposePost(
  request: RepurposeRequest,
  userId?: string,
): Promise<RepurposeResult> {
  const model = await createModel(request.provider, request.model, userId);

  const sourcePlatformName = PLATFORM_SPECS[request.sourcePlatform]?.name ?? request.sourcePlatform;

  const targetSpecs = request.targetPlatforms
    .map((p) => {
      const spec = PLATFORM_SPECS[p];
      if (!spec) return `- ${p}: Adapt naturally for this platform`;
      return `- **${spec.name}** (${p}):
  - Character limit: ${spec.charLimit}
  - Hashtag style: ${spec.hashtagStyle}
  - Formatting: ${spec.formatting}`;
    })
    .join('\n\n');

  const system = `You are an expert content repurposing specialist. You take content created for one social media platform and skillfully adapt it for other platforms while preserving the core message and value.

## Tone: ${request.tone}

## Your Approach:
1. Identify the core message and key insights from the original content
2. Adapt the FORMAT to match each platform's conventions (not just truncate)
3. Adjust the TONE to match each platform's culture
4. Optimize for each platform's algorithm (engagement patterns differ)
5. Preserve the author's voice and authenticity

## Important Rules:
- Do NOT just shorten or lengthen the original. Genuinely ADAPT it.
- Each platform version should feel native to that platform
- A LinkedIn post repurposed for Twitter isn't a summary - it's a reimagining
- A Twitter post repurposed for LinkedIn isn't just padding - it's expansion with added depth
- Hashtags should NOT include the # symbol in the response
- Each variant must respect the platform's character limit

## Target Platform Specifications:
${targetSpecs}

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "variants": {
    ${request.targetPlatforms.map((p) => `"${p}": { "content": "Adapted content for ${PLATFORM_SPECS[p]?.name ?? p}", "hashtags": ["tag1", "tag2"] }`).join(',\n    ')}
  }
}

Return ONLY valid JSON. No markdown code fences, no extra text.`;

  const user = `Repurpose this ${sourcePlatformName} post for the target platforms:

---
${request.content}
---

Adapt this content for each target platform while keeping the core message intact.`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.7,
    maxTokens: 3072,
  });

  const parsed = parseJsonResponse(result.text);
  const variants: Record<string, RepurposeVariant> = {};

  if (parsed.variants && typeof parsed.variants === 'object') {
    for (const [platform, variant] of Object.entries(parsed.variants) as [string, any][]) {
      variants[platform] = {
        content: variant.content ?? '',
        hashtags: Array.isArray(variant.hashtags) ? variant.hashtags : [],
      };
    }
  }

  return { variants };
}
