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
  const platformNames = platforms.map((pid) => PLATFORMS[pid].name).join(', ');

  const system = `You are a world-class copywriter and content strategist specializing in high-conversion, viral social media posts.
Your goal is to transform user prompts into copywriting masterpieces that capture attention, build trust, and spark action.

## Tone & Voice Guidance
${toneHint}

## Language
You must write all content in: ${language || 'English'}

## Platform Constraints
${platformConstraints}

## Core Copywriting Rules (To Make Content Look Human and Highly Engaging):
1. **The Hook (First 1-2 Lines)**: Must capture attention immediately. Use curiosity gaps, a contrarian perspective, a surprising statistic, or a direct statement addressing a major pain point. Avoid generic openings (e.g., "Hello everyone", "In this post", "I am thrilled to share").
2. **Formatting & Visual Layout**:
   - Use generous spacing and single-sentence paragraphs. Large text walls are strictly forbidden.
   - Use bullet points for lists (using simple emojis or clean dashes).
   - Ensure the content is easily scannable on mobile screens.
3. **Cliché Elimination**: Avoid artificial, robotic terms that signal AI writing. Specifically, NEVER use: "delve", "testament", "revolutionize", "pioneering", "moreover", "furthermore", "essential", "crucial", "tapestry", "beacon", "in conclusion", "it is important to remember".
4. **Call to Action (CTA)**: Conclude with a strong, highly natural question or conversational prompt to encourage low-friction engagement in the comments.
5. **Platform Customization**:
   - **LinkedIn**: Thoughtful, professional yet relatable, structured as a story or expert insight.
   - **Twitter/X**: Ultra-punchy, concise, single idea per tweet, highly shareable.
   - **Instagram/Facebook**: Highly visual, empathetic, conversational, structured with emojis.

## Response Format
You MUST respond in valid JSON with this exact structure:
{
  "content": "The main/generic version of the post",
  "platformVariants": {
    ${platforms.map((pid) => `"${pid}": "Platform-optimized variant for ${PLATFORMS[pid].name}"`).join(',\n    ')}
  },
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

Important rules:
- Respect each platform's character limit exactly.
- Hashtags in the "hashtags" array should NOT include the # symbol.
- Always return ONLY valid JSON. No markdown code fences (like \`\`\`json), no introductory or concluding chat text.`;

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
  const platformNames = platforms.map((pid) => PLATFORMS[pid].name).join(', ');

  const system = `You are a world-class copywriter and content strategist.
${toneHint}
Language: Write all content in ${language || 'English'}

Generate a single high-quality post that works well across these platforms: ${platformNames}.

Core Writing Rules:
1. **The Hook**: Start with a high-impact hook in the first 1-2 lines. Avoid generic openers.
2. **Formatting**: Use generous spacing (single-sentence paragraphs). Use clean bullets and emojis. No walls of text.
3. **Cliché Elimination**: Do NOT use AI clichés: "delve", "testament", "revolutionize", "pioneering", "moreover", "furthermore", "essential", "crucial", "tapestry", "beacon".
4. **Call to Action**: End with a strong conversational question.
5. **No Hashtags**: Do NOT include hashtags in the main body.
Do NOT use JSON format — output the raw text of the post directly.`;

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

  const system = `You are a world-class social media content optimizer.
${toneHint}

## Platform constraints
${platformConstraints}

Given a main post, create optimized variants for each platform and suggest hashtags.

Apply these rules:
1. Respect character limits for each platform exactly.
2. Structure the LinkedIn variant for story/value-driven engagement, and Twitter/X as a punchy, highly shareable update.
3. Absolutely avoid typical AI buzzwords ("delve", "testament", "revolutionize").
4. Keep the hook and spacing clean across all variants.

Respond in valid JSON ONLY:
{
  "platformVariants": {
    ${platforms.map((pid) => `"${pid}": "Optimized variant for ${PLATFORMS[pid].name}"`).join(',\n    ')}
  },
  "hashtags": ["tag1", "tag2", "tag3"]
}

Rules:
- Hashtags without the # symbol.
- Return ONLY valid JSON. No markdown backticks, no extra chat text.`;

  const user = `Original post:\n${mainContent}\n\nCreate platform variants and hashtags.`;

  return { system, user };
}
