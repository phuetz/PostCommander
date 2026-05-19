import { z } from 'zod';
import type { LLMProviderId } from '@postcommander/shared';
import { runLLM } from './_runtime.js';

export interface GenerateHooksRequest {
  topic: string;
  platform: string;
  tone: string;
  provider: LLMProviderId;
  model: string;
  count?: number;
}

export interface GenerateHooksResult {
  hooks: string[];
}

const responseSchema = z.object({
  hooks: z.array(z.string()).default([]),
});

/**
 * Generate multiple attention-grabbing hook/opening lines for a given topic.
 */
export async function generateHooks(
  request: GenerateHooksRequest,
  userId?: string,
): Promise<GenerateHooksResult> {
  const count = request.count ?? 5;

  const system = `You are a world-class social media copywriter specializing in viral hooks and opening lines. Your job is to generate attention-grabbing first lines that stop people from scrolling.

## Platform: ${request.platform}
## Tone: ${request.tone}

## Hook Strategies to Use (mix these across your options):
1. **Bold Claim**: Start with a surprising statistic or contrarian statement
   Example: "I made $100K last month. Here's why I'm not happy about it."
2. **Question Hook**: Ask a thought-provoking question the reader can't ignore
   Example: "What if everything you know about productivity is wrong?"
3. **Story Hook**: Begin with a micro-story that creates instant curiosity
   Example: "Three years ago, I was sleeping in my car. Yesterday, I rang the NASDAQ bell."
4. **Pattern Interrupt**: Say something unexpected that breaks the reader's pattern
   Example: "Stop setting goals. No, seriously. Here's why."
5. **Relatability Hook**: Name a shared frustration or experience
   Example: "You've rewritten your LinkedIn headline 47 times and it still sounds generic."
6. **Curiosity Gap**: Tease information without revealing it
   Example: "The one skill every CEO I've met has in common (and it's not what you think)."
7. **Direct Challenge**: Challenge the reader's current beliefs
   Example: "You don't have an imposter syndrome problem. You have a visibility problem."
8. **Number Hook**: Use specific numbers to create credibility
   Example: "I've interviewed 200+ candidates this year. Only 3 did this one thing."

## Rules:
- Each hook should be 1-2 sentences maximum
- Hooks should be varied in style (don't repeat the same pattern)
- Tailor hooks to the platform's culture and format
- For Twitter/X: Keep under 280 characters
- For LinkedIn: Professional but attention-grabbing
- For Instagram: Visual, emotional, conversational
- Make them feel authentic, not clickbaity
- Do NOT use placeholder brackets like [number] or [topic]

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "hooks": ["Hook 1", "Hook 2", "Hook 3"]
}

Generate exactly ${count} hooks. Return ONLY valid JSON.`;

  const { data } = await runLLM({
    provider: request.provider,
    model: request.model,
    userId,
    system,
    user: `Generate ${count} attention-grabbing hook/opening lines about: ${request.topic}`,
    temperature: 0.9,
    maxTokens: 1024,
    schema: responseSchema,
  });

  return { hooks: data.hooks ?? [] };
}
