import { ORIGINATOR, RESPONSES_URL } from '../../auth/codex/constants.js';
import type { ChatGptAuth } from '../../auth/codex/index.js';

export interface ResponsesTurnInput {
  auth: ChatGptAuth;
  model: string;
  instructions: string;
  /**
   * Conversation input items. For single-turn text generation, pass
   * `[{ type: 'message', role: 'user', content: [{ type: 'input_text', text: '...' }] }]`.
   */
  input: Array<Record<string, unknown>>;
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  /** Streaming text delta callback (assistant message tokens). */
  onTextDelta?: (delta: string) => void;
  /** Abort signal — useful when the client disconnects. */
  signal?: AbortSignal;
}

export interface ResponsesTurnResult {
  /** Accumulated assistant text. */
  text: string;
}

/**
 * Single turn against `https://chatgpt.com/backend-api/codex/responses`.
 *
 * Mirrors `call_responses_turn` from
 * `D:/CascadeProjects/gitnexus-rs-from-c/crates/gitnexus-cli/src/commands/ask/responses.rs`.
 *
 * The Responses API format differs from OpenAI's chat/completions:
 * - `instructions` instead of system message
 * - `input` is an array of items (messages, function_call, function_call_output)
 * - SSE events: `response.output_text.delta`, `response.output_item.done`, etc.
 */
export async function callResponsesTurn(
  params: ResponsesTurnInput,
): Promise<ResponsesTurnResult> {
  const body: Record<string, unknown> = {
    model: params.model,
    instructions: params.instructions,
    input: params.input,
    store: false,
    stream: true,
  };
  if (params.reasoningEffort && params.reasoningEffort !== 'none') {
    body.reasoning = { effort: params.reasoningEffort };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.auth.access_token}`,
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
    originator: ORIGINATOR,
    'User-Agent': 'postcommander-server/1.0',
  };
  if (params.auth.account_id) {
    headers['ChatGPT-Account-ID'] = params.auth.account_id;
  }
  if (params.auth.is_fedramp) {
    headers['X-OpenAI-Fedramp'] = 'true';
  }

  const resp = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: params.signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(
      `ChatGPT Pro responses error ${resp.status}: ${sanitize(text, params.auth.access_token)}`,
    );
  }

  if (!resp.body) {
    throw new Error('ChatGPT Pro responses returned no body');
  }

  let fullText = '';
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIndex: number;
    while ((nlIndex = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nlIndex).trim();
      buffer = buffer.slice(nlIndex + 1);
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;

      let event: { type?: string; delta?: string };
      try {
        event = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
        fullText += event.delta;
        params.onTextDelta?.(event.delta);
      }
      // We currently ignore tool calls / reasoning / done events — text is enough
      // for the generation use cases (post, blog, assist).
    }
  }

  return { text: fullText };
}

function sanitize(s: string, secret: string): string {
  const safe = s.replaceAll(secret, '[redacted]');
  return safe.length > 600 ? `${safe.slice(0, 600)}…` : safe;
}
