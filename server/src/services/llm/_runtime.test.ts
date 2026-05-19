import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const generateTextMock = vi.hoisted(() => vi.fn());
const createModelMock = vi.hoisted(() => vi.fn());

vi.mock('ai', () => ({ generateText: generateTextMock }));
vi.mock('./provider-factory.js', () => ({ createModel: createModelMock }));

import { runLLM, parseJsonResponse } from './_runtime.js';

beforeEach(() => {
  vi.clearAllMocks();
  createModelMock.mockResolvedValue({ id: 'fake-model' });
});

describe('parseJsonResponse', () => {
  it('parses plain JSON', () => {
    expect(parseJsonResponse('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips ```json fence', () => {
    expect(parseJsonResponse('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it('strips bare ``` fence', () => {
    expect(parseJsonResponse('```\n{"b":3}\n```')).toEqual({ b: 3 });
  });

  it('tolerates leading/trailing whitespace', () => {
    expect(parseJsonResponse('   {"c":4}  ')).toEqual({ c: 4 });
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonResponse('not json')).toThrow();
  });
});

describe('runLLM', () => {
  it('returns raw text when no schema provided', async () => {
    generateTextMock.mockResolvedValueOnce({ text: 'plain reply' });
    const { data, raw, attempts } = await runLLM({
      provider: 'openai',
      model: 'gpt-4o',
      system: 's',
      user: 'u',
    });
    expect(data).toBe('plain reply');
    expect(raw).toBe('plain reply');
    expect(attempts).toBe(1);
  });

  it('parses + validates JSON when schema provided', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: '```json\n{"hooks":["a","b"]}\n```',
    });
    const { data } = await runLLM({
      provider: 'openai',
      model: 'gpt-4o',
      system: 's',
      user: 'u',
      schema: z.object({ hooks: z.array(z.string()) }),
    });
    expect(data).toEqual({ hooks: ['a', 'b'] });
  });

  it('retries on transient JSON parse failure then succeeds', async () => {
    generateTextMock
      .mockResolvedValueOnce({ text: 'not json' })
      .mockResolvedValueOnce({ text: '{"x":1}' });
    const { data, attempts } = await runLLM({
      provider: 'openai',
      model: 'gpt-4o',
      system: 's',
      user: 'u',
      schema: z.object({ x: z.number() }),
      retries: 1,
    });
    expect(data).toEqual({ x: 1 });
    expect(attempts).toBe(2);
  });

  it('throws after exhausting retries', async () => {
    generateTextMock.mockResolvedValue({ text: 'broken' });
    await expect(
      runLLM({
        provider: 'openai',
        model: 'gpt-4o',
        system: 's',
        user: 'u',
        schema: z.object({ x: z.number() }),
        retries: 1,
      }),
    ).rejects.toThrow();
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it('passes provider/model/userId through to createModel', async () => {
    generateTextMock.mockResolvedValueOnce({ text: 'ok' });
    await runLLM({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      userId: 'user-123',
      system: 's',
      user: 'u',
    });
    expect(createModelMock).toHaveBeenCalledWith('anthropic', 'claude-3-5-sonnet', 'user-123');
  });
});
