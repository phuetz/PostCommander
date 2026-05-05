import { generateText } from 'ai';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface ABTestRequest {
  prompt: string;
  platform: string;
  tone: string;
  provider: LLMProviderId;
  model: string;
  variantCount?: number;
}

export interface ABVariant {
  id: string;
  content: string;
  angle: string;
  hookStyle: string;
}

export interface ABTestResult {
  variants: ABVariant[];
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

/**
 * Generate multiple distinct A/B test variants of the same post idea.
 * Each variant uses a genuinely different angle/approach.
 */
export async function generateABVariants(
  request: ABTestRequest,
  userId?: string,
): Promise<ABTestResult> {
  const model = createModel(request.provider, request.model, userId);
  const count = request.variantCount ?? 3;

  const system = `You are a world-class social media strategist and copywriter. Your job is to generate multiple DISTINCT variants of the same post idea, each with a genuinely different angle and hook style.

## Platform: ${request.platform}
## Tone: ${request.tone}

## Instructions:
Generate exactly ${count} variants of a social media post based on the user's prompt.

Each variant MUST use a distinctly different approach:
1. **Direct/Bold** — Strong opening statement, assertive tone, clear call to action
2. **Storytelling** — Personal anecdote or narrative approach, emotional arc
3. **Data-Driven** — Lead with statistics, numbers, or research findings
4. **Question-Led** — Open with thought-provoking questions, engage curiosity
5. **Contrarian** — Challenge conventional wisdom, present an unexpected take

Pick ${count} different approaches from the list above (or create your own unique angles).

Each variant should be a complete, ready-to-publish post for the specified platform.

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "variants": [
    {
      "id": "variant-1",
      "content": "The full post text...",
      "angle": "A short label for the approach (e.g., 'Storytelling', 'Data-Driven')",
      "hookStyle": "A brief description of the hook strategy used"
    }
  ]
}

Rules:
- Each variant must be substantially different — not just rewording the same content
- Each variant should be platform-appropriate in length and style
- Number the IDs as variant-1, variant-2, etc.
- Return ONLY valid JSON. No markdown, no extra text.`;

  const user = `Generate ${count} distinct A/B test variants of a social media post about: ${request.prompt}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.9,
    maxTokens: 4096,
  });

  const parsed = parseJsonResponse(result.text);

  return {
    variants: Array.isArray(parsed.variants)
      ? parsed.variants.map((v: any, i: number) => ({
          id: v.id || `variant-${i + 1}`,
          content: v.content || '',
          angle: v.angle || `Variant ${i + 1}`,
          hookStyle: v.hookStyle || 'Standard',
        }))
      : [],
  };
}
