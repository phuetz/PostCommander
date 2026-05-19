import { z } from 'zod';
import type { LLMProviderId } from '@postcommander/shared';
import { runLLM } from './_runtime.js';

export interface TrendingRequest {
  platform: string;
  industry: string;
  language?: string;
  provider: LLMProviderId;
  model: string;
}

export interface TrendingTopic {
  title: string;
  description: string;
  trendScore: number;
  suggestedAngles: string[];
}

export interface TrendingResult {
  topics: TrendingTopic[];
}

// Lenient schema: the LLM frequently sends extra fields or omits some — we
// coerce + default rather than reject, then normalize in code after parsing.
const responseSchema = z.object({
  topics: z
    .array(
      z.object({
        title: z.string().default('Untitled'),
        description: z.string().default(''),
        trendScore: z.number().default(50),
        suggestedAngles: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

/**
 * Get trending topics for a given industry and platform using LLM.
 */
export async function getTrendingTopics(
  request: TrendingRequest,
  userId?: string,
): Promise<TrendingResult> {
  const language = request.language || 'English';

  const system = `You are a social media trend analyst and content strategist. Your job is to identify current trending topics, conversations, and content themes that are gaining traction on social media.

## Platform: ${request.platform}
## Industry: ${request.industry}
## Language: ${language}

## Instructions:
Generate 8-12 trending topics that are currently relevant and gaining traction in the specified industry on the specified platform.

For each topic, provide:
1. A clear, specific title
2. A brief description explaining why it's trending and what the conversation is about
3. A trend score (0-100) indicating how hot/relevant the topic is right now
4. 3-4 suggested content angles that a creator could use to write about this topic

## Topic Selection Criteria:
- Focus on topics that are timely and currently being discussed
- Include a mix of evergreen trending themes and timely topics
- Consider the platform's culture and what performs well there
- Include industry-specific topics, not just generic trends
- Think about what would generate the most engagement

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "topics": [
    {
      "title": "Clear topic title",
      "description": "Why this is trending and what the conversation is about",
      "trendScore": 85,
      "suggestedAngles": [
        "Angle 1: specific content approach",
        "Angle 2: specific content approach",
        "Angle 3: specific content approach"
      ]
    }
  ]
}

Rules:
- Generate 8-12 topics
- Trend scores should be varied (not all high)
- Sort by trendScore descending
- Suggested angles should be specific and actionable
- Return ONLY valid JSON. No markdown, no extra text.`;

  const { data } = await runLLM({
    provider: request.provider,
    model: request.model,
    userId,
    system,
    user: `What are the current trending topics in ${request.industry} on ${request.platform}? Respond in ${language}.`,
    temperature: 0.8,
    maxTokens: 4096,
    schema: responseSchema,
  });

  return {
    topics: (data.topics ?? []).map((t) => ({
      title: t.title ?? 'Untitled',
      description: t.description ?? '',
      trendScore: Math.max(0, Math.min(100, Math.round(t.trendScore ?? 50))),
      suggestedAngles: t.suggestedAngles ?? [],
    })),
  };
}
