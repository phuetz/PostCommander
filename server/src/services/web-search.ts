import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export async function searchWeb(query: string, limit = 3): Promise<SearchResult[]> {
  if (!config.TAVILY_API_KEY) {
    logger.warn('[WebSearch] TAVILY_API_KEY not configured. Returning mock/empty results.');
    return [
      {
        title: `Simulated Search Result for: ${query}`,
        url: 'https://example.com/mock-result',
        content: `This is a mock search result because TAVILY_API_KEY is not configured in your environment. Please configure it to get real web search results for the topic: ${query}.`,
      },
    ];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: limit,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, errorText }, '[WebSearch] Tavily API error');
      return [];
    }

    const data = await response.json();
    return data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  } catch (error) {
    logger.error({ err: error }, '[WebSearch] Error executing web search');
    return [];
  }
}
