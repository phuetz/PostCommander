import { generateText } from 'ai';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface ResearchHashtagsRequest {
  topic: string;
  platform: string;
  provider: LLMProviderId;
  model: string;
  count?: number;
}

export interface HashtagResult {
  tag: string;
  category: 'trending' | 'popular' | 'niche';
  relevance: number;
}

export interface ResearchHashtagsResult {
  hashtags: HashtagResult[];
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

const PLATFORM_HASHTAG_GUIDES: Record<string, string> = {
  linkedin: `LinkedIn Hashtag Best Practices:
- Use 3-5 hashtags per post
- Mix broad industry hashtags with niche ones
- Professional and industry-specific hashtags perform best
- Avoid overly generic hashtags like #success or #motivation (too competitive)
- Trending topics on LinkedIn tend to be business, leadership, and tech-focused`,

  twitter: `Twitter/X Hashtag Best Practices:
- Use 1-3 hashtags maximum (more reduces engagement)
- Trending hashtags change rapidly
- Integrate hashtags naturally into the tweet text
- Community hashtags (e.g., #BuildInPublic, #IndieHackers) drive targeted engagement
- Branded hashtags work well for campaigns`,

  instagram: `Instagram Hashtag Best Practices:
- Use 20-30 hashtags for maximum reach
- Mix sizes: 5-10 large (1M+ posts), 10-15 medium (100K-1M), 5-10 small/niche (<100K)
- Niche hashtags have less competition and higher engagement rates
- Use hashtags in the caption or first comment
- Create a mix of content-type and audience-type hashtags`,

  tiktok: `TikTok Hashtag Best Practices:
- Use 3-5 hashtags
- Trending hashtags are crucial on TikTok
- Mix trending and niche hashtags
- #fyp and #foryoupage are high-volume but low-targeting
- Sound-related and challenge hashtags perform well`,

  facebook: `Facebook Hashtag Best Practices:
- Use 2-5 hashtags sparingly
- Hashtags are less impactful on Facebook than other platforms
- Group-specific hashtags can help within communities
- Keep them relevant and minimal`,

  pinterest: `Pinterest Hashtag Best Practices:
- Use 2-5 keyword-rich hashtags
- SEO-style hashtags work best (descriptive, searchable)
- Seasonal and trending topic hashtags drive discovery
- Think of them as search keywords`,
};

/**
 * Research and generate relevant hashtags for a topic on a specific platform.
 */
export async function researchHashtags(
  request: ResearchHashtagsRequest,
  userId?: string,
): Promise<ResearchHashtagsResult> {
  const model = await createModel(request.provider, request.model, userId);
  const count = request.count ?? 15;

  const platformGuide =
    PLATFORM_HASHTAG_GUIDES[request.platform] ??
    'Use relevant hashtags appropriate for the platform.';

  const system = `You are a social media hashtag strategist with deep knowledge of hashtag performance across platforms.

## Platform: ${request.platform}
${platformGuide}

## Your Task:
Generate ${count} highly relevant hashtags for the given topic, categorized by their estimated popularity/competition level:

- **trending**: High-volume, currently trending or very popular hashtags. These give broad reach but face heavy competition. (relevance 0.6-0.8)
- **popular**: Established hashtags with consistent usage. Good balance of reach and competition. (relevance 0.7-0.9)
- **niche**: Specific, targeted hashtags with smaller but highly engaged audiences. Best for targeted reach. (relevance 0.8-1.0)

## Rules:
- Hashtags should NOT include the # symbol
- Each hashtag must be directly relevant to the topic
- Provide a good mix across all three categories
- Relevance score should reflect how well the hashtag matches the topic (0.0 to 1.0)
- Avoid generic hashtags that could apply to any topic
- Consider the platform's culture when selecting hashtags
- Make hashtags realistic - these should be hashtags that actually exist and are used

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "hashtags": [
    { "tag": "hashtagname", "category": "trending", "relevance": 0.85 },
    { "tag": "anothertag", "category": "niche", "relevance": 0.92 }
  ]
}

Generate exactly ${count} hashtags. Return ONLY valid JSON.`;

  const user = `Research the best hashtags for this topic on ${request.platform}: ${request.topic}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.7,
    maxTokens: 1024,
  });

  const parsed = parseJsonResponse(result.text);
  const hashtags: HashtagResult[] = [];

  if (Array.isArray(parsed.hashtags)) {
    for (const h of parsed.hashtags) {
      hashtags.push({
        tag: String(h.tag ?? '').replace(/^#/, ''),
        category: ['trending', 'popular', 'niche'].includes(h.category) ? h.category : 'popular',
        relevance: typeof h.relevance === 'number' ? Math.min(1, Math.max(0, h.relevance)) : 0.5,
      });
    }
  }

  return { hashtags };
}
