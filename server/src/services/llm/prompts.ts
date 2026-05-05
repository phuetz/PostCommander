import { PLATFORMS, TONES } from '@postcommander/shared';
import type { PlatformId, ToneId } from '@postcommander/shared';

function getToneHint(toneId: ToneId): string {
  const tone = TONES.find((t: { id: string; promptHint: string }) => t.id === toneId);
  return tone?.promptHint ?? 'Write in a professional and engaging tone.';
}

function getPlatformConstraints(platformIds: PlatformId[]): string {
  return platformIds
    .map((pid) => {
      const p = PLATFORMS[pid];
      const parts = [`- ${p.name}: max ${p.charLimit} characters`];
      if (p.supportsHashtags) {
        parts.push(`up to ${p.maxHashtags} hashtags`);
      }
      return parts.join(', ');
    })
    .join('\n');
}

export interface BuiltPrompts {
  system: string;
  user: string;
}

/**
 * Build the system and user prompts for post generation.
 */
export function buildPrompts(params: {
  prompt: string;
  platforms: PlatformId[];
  tone: ToneId;
  language: string;
}): BuiltPrompts {
  const { prompt, platforms, tone, language } = params;

  const toneHint = getToneHint(tone);
  const platformConstraints = getPlatformConstraints(platforms);
  const platformNames = platforms
    .map((pid) => PLATFORMS[pid].name)
    .join(', ');

  const system = `You are an expert social media content creator. Your job is to generate engaging, platform-optimized posts based on user prompts.

## Tone
${toneHint}

## Language
Write the post in: ${language || 'English'}

## Platform constraints
${platformConstraints}

## Instructions
1. Generate a main post that captures the essence of the user's request.
2. For EACH target platform, generate an optimized variant that respects character limits and platform conventions.
3. Suggest relevant hashtags that are popular and appropriate.

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "content": "The main/generic version of the post",
  "platformVariants": {
    ${platforms.map((pid) => `"${pid}": "Platform-optimized version for ${PLATFORMS[pid].name}"`).join(',\n    ')}
  },
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

Important rules:
- Each platform variant MUST respect that platform's character limit.
- Hashtags should NOT include the # symbol (just the text).
- For Twitter/X, keep it concise and punchy.
- For LinkedIn, be more professional and detailed.
- For Instagram, make it visually descriptive and emoji-friendly.
- For TikTok, use trending language and hooks.
- For Facebook, be conversational and shareable.
- For Pinterest, be descriptive and keyword-rich.
- Always return ONLY valid JSON. No markdown code fences, no extra text.`;

  const user = `Generate a social media post for ${platformNames}.

Topic/prompt: ${prompt}`;

  return { system, user };
}

/**
 * Build a simpler prompt for streaming — we generate the main content first,
 * then generate variants in a second pass.
 */
export function buildStreamingPrompts(params: {
  prompt: string;
  platforms: PlatformId[];
  tone: ToneId;
  language: string;
}): BuiltPrompts {
  const { prompt, platforms, tone, language } = params;
  const toneHint = getToneHint(tone);
  const platformNames = platforms
    .map((pid) => PLATFORMS[pid].name)
    .join(', ');

  const system = `You are an expert social media content creator. ${toneHint}
Write in: ${language || 'English'}

Generate an engaging social media post for these platforms: ${platformNames}.
Write a single high-quality post that works well across the requested platforms.
Be creative, engaging, and on-brand. Do NOT include hashtags in the main text.
Do NOT use JSON format — just write the post text directly.`;

  const user = `Generate a social media post about: ${prompt}`;

  return { system, user };
}

/**
 * Build a follow-up prompt for generating platform variants + hashtags from main content.
 */
export function buildVariantsPrompt(params: {
  mainContent: string;
  platforms: PlatformId[];
  tone: ToneId;
}): BuiltPrompts {
  const { mainContent, platforms, tone } = params;
  const toneHint = getToneHint(tone);
  const platformConstraints = getPlatformConstraints(platforms);

  const system = `You are an expert social media content optimizer. ${toneHint}

## Platform constraints
${platformConstraints}

Given a main post, create optimized variants for each platform and suggest hashtags.

Respond in valid JSON ONLY:
{
  "platformVariants": {
    ${platforms.map((pid) => `"${pid}": "Optimized for ${PLATFORMS[pid].name}"`).join(',\n    ')}
  },
  "hashtags": ["tag1", "tag2", "tag3"]
}

Rules:
- Respect each platform's character limit.
- Hashtags without the # symbol.
- Return ONLY valid JSON. No markdown, no extra text.`;

  const user = `Original post:\n${mainContent}\n\nCreate platform variants and hashtags.`;

  return { system, user };
}
