import { generateText } from 'ai';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface EngagementRequest {
  content: string;
  platform: string;
  provider: LLMProviderId;
  model: string;
}

export interface EngagementBreakdown {
  hookStrength: number;
  readability: number;
  emotionalAppeal: number;
  callToAction: number;
  hashtagRelevance: number;
  lengthOptimization: number;
}

export interface EngagementResult {
  overallScore: number;
  breakdown: EngagementBreakdown;
  suggestions: string[];
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
 * Predict engagement for a post using LLM analysis.
 */
export async function predictEngagement(
  request: EngagementRequest,
  userId?: string,
): Promise<EngagementResult> {
  const model = await createModel(request.provider, request.model, userId);

  const system = `You are an expert social media analyst specializing in engagement prediction and content optimization. Analyze the given post content and predict its engagement potential.

## Platform: ${request.platform}

## Analysis Criteria:
1. **Hook Strength** (0-100): How strong is the opening line? Does it stop the scroll?
2. **Readability** (0-100): Is it easy to read? Good formatting, sentence variety, whitespace?
3. **Emotional Appeal** (0-100): Does it evoke emotions? Connection, curiosity, inspiration?
4. **Call to Action** (0-100): Does it encourage engagement (comments, shares, saves)?
5. **Hashtag Relevance** (0-100): Are hashtags present and relevant? (0 if no hashtags and platform uses them)
6. **Length Optimization** (0-100): Is the length optimal for the platform?

## Platform-specific considerations:
- **LinkedIn**: Ideal 1200-1500 chars, professional hooks, storytelling, line breaks
- **Twitter/X**: Under 280 chars, punchy, hashtags optional but concise
- **Instagram**: 150-2200 chars, emoji-friendly, hashtags important (up to 30)
- **TikTok**: Short and punchy captions, trending language, hooks matter
- **Facebook**: 40-80 chars for max engagement, conversational tone
- **Pinterest**: Keyword-rich, descriptive, 100-500 chars

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "overallScore": 75,
  "breakdown": {
    "hookStrength": 80,
    "readability": 70,
    "emotionalAppeal": 65,
    "callToAction": 60,
    "hashtagRelevance": 50,
    "lengthOptimization": 85
  },
  "suggestions": [
    "Actionable suggestion 1",
    "Actionable suggestion 2",
    "Actionable suggestion 3"
  ]
}

Rules:
- All scores must be integers between 0 and 100
- overallScore should be a weighted average (hook 25%, readability 15%, emotional 20%, CTA 15%, hashtags 10%, length 15%)
- Provide 3-6 specific, actionable suggestions
- Suggestions should be concrete improvements, not generic advice
- Return ONLY valid JSON. No markdown, no extra text.`;

  const user = `Analyze this ${request.platform} post for engagement potential:\n\n${request.content}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.3,
    maxTokens: 1024,
  });

  const parsed = parseJsonResponse(result.text);

  const breakdown: EngagementBreakdown = {
    hookStrength: clampScore(parsed.breakdown?.hookStrength),
    readability: clampScore(parsed.breakdown?.readability),
    emotionalAppeal: clampScore(parsed.breakdown?.emotionalAppeal),
    callToAction: clampScore(parsed.breakdown?.callToAction),
    hashtagRelevance: clampScore(parsed.breakdown?.hashtagRelevance),
    lengthOptimization: clampScore(parsed.breakdown?.lengthOptimization),
  };

  return {
    overallScore: clampScore(parsed.overallScore),
    breakdown,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

function clampScore(value: any): number {
  const num = typeof value === 'number' ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}
