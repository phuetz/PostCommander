import { getChatGptAuth } from '../../auth/codex/index.js';
import { callResponsesTurn } from './responses-api.js';

export interface ChatGptProGenerateInput {
  userId: string;
  model: string;
  system: string;
  prompt: string;
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  onTextDelta?: (delta: string) => void;
}

/**
 * Generate text using the user's connected ChatGPT Pro account.
 *
 * Throws if the user has not connected (or the refresh failed) so callers can
 * fall back to API key providers.
 */
export async function chatgptProGenerate(input: ChatGptProGenerateInput): Promise<string> {
  const auth = await getChatGptAuth(input.userId);
  if (!auth) {
    throw new Error(
      'ChatGPT Pro non connecté. Va dans Réglages → Compte ChatGPT Pro pour te connecter.',
    );
  }

  const result = await callResponsesTurn({
    auth,
    model: input.model,
    instructions: input.system,
    input: [
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: input.prompt }],
      },
    ],
    reasoningEffort: input.reasoningEffort,
    onTextDelta: input.onTextDelta,
  });

  return result.text;
}

/** True when the user has a usable ChatGPT Pro auth on file.
 *  Never throws — DB or refresh errors are swallowed and reported as "not available". */
export async function chatgptProAvailable(userId: string): Promise<boolean> {
  try {
    return (await getChatGptAuth(userId)) !== null;
  } catch {
    return false;
  }
}
