import { logger } from './logger.js';

/**
 * Parse a JSON string that may contain markdown code fences.
 */
export function parseJsonResponse(text: string): any {
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
 * Generates JSON using an LLM and automatically retries if the output is not valid JSON.
 * On failure, it passes the exact parsing error back to the LLM to help it self-correct.
 */
export async function generateJsonWithRetry<T>(
  generateFn: (prompt: string) => Promise<string>,
  initialPrompt: string,
  maxRetries: number = 2
): Promise<T> {
  let currentPrompt = initialPrompt;
  let lastError: Error | null = null;
  let lastRawText: string = '';

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const resultText = await generateFn(currentPrompt);
      lastRawText = resultText;
      
      // Attempt to parse
      const parsed = parseJsonResponse(resultText);
      
      if (attempt > 1) {
        logger.info(`[Self-Healing] Successfully recovered JSON on attempt ${attempt}`);
      }
      
      return parsed as T;
    } catch (error: any) {
      lastError = error;
      logger.warn({ attempt, error: error.message }, '[Self-Healing] Invalid JSON received from LLM, retrying...');
      
      // Update prompt to ask the model to fix its mistake
      currentPrompt = `You previously returned an invalid JSON object. Here is the raw text you returned:\n\n${lastRawText}\n\nWhen trying to parse it, I received this error:\n${error.message}\n\nPlease fix the JSON syntax error and return ONLY the valid JSON object without any additional conversational text.`;
    }
  }

  logger.error({ err: lastError }, '[Self-Healing] Exhausted all retries for JSON parsing');
  throw new Error(`Failed to generate valid JSON after ${maxRetries} retries: ${lastError?.message}`);
}
