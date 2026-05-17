import * as cheerio from 'cheerio';
import { logger } from './logger.js';

/**
 * Extracts and cleans text content from a given URL.
 * Automatically fetches the HTML and removes boilerplate (nav, footer, script, style).
 */
export async function extractTextFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      logger.warn({ url, status: response.status }, 'Failed to fetch URL for scraping');
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove boilerplate
    $('script, style, noscript, iframe, nav, footer, header, aside, .cookie-banner, #cookie-banner, .ads, #ads').remove();

    // Extract main text
    let text = $('body').text();
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate to reasonable length to avoid overwhelming the LLM prompt limits (e.g. 15,000 chars)
    if (text.length > 15000) {
      text = text.substring(0, 15000) + '... [Content truncated]';
    }

    return text;
  } catch (error) {
    logger.error({ err: error, url }, 'Error extracting text from URL');
    return null;
  }
}

/**
 * Detects if a prompt contains a URL, and if so, replaces/appends the extracted content.
 */
export async function enrichPromptWithUrls(prompt: string): Promise<string> {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = prompt.match(urlRegex);

  if (!urls || urls.length === 0) {
    return prompt;
  }

  let enrichedPrompt = prompt;
  
  // We only extract the first 3 URLs to avoid hanging the request
  for (const url of urls.slice(0, 3)) {
    const extractedText = await extractTextFromUrl(url);
    if (extractedText) {
      enrichedPrompt += `\n\n--- Extracted Content from ${url} ---\n${extractedText}\n-----------------------------------\n`;
    }
  }

  return enrichedPrompt;
}
