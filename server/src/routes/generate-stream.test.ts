import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../services/llm/index.js', () => ({
  generatePost: vi.fn(),
  streamPost: vi.fn(async (_request, _userId, onChunk) => {
    onChunk({ type: 'text-delta', content: 'Hello world' });
    onChunk({ type: 'hashtags', hashtags: ['postcommander'] });

    return {
      content: 'Hello world',
      platformVariants: { linkedin: 'Hello world' },
      hashtags: ['postcommander'],
    };
  }),
}));

import { createApp } from '../app.js';
import {
  closeTestDatabase,
  createAuthCookie,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';

describe('Generate Stream Route', () => {
  const app = createApp();

  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    resetTestDatabase();
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/generate/stream')
      .send({
        prompt: 'test',
        platforms: ['linkedin'],
        tone: 'professional',
        provider: 'openai',
        model: 'gpt-4o-mini',
        language: 'English',
      });

    expect(response.status).toBe(401);
  });

  it('emits SSE events the client can consume, including a final done payload', async () => {
    const user = await createTestUser({ email: 'alice@example.com', plan: 'free' });

    const response = await request(app)
      .post('/api/generate/stream')
      .set('Cookie', createAuthCookie(user.id))
      .send({
        prompt: 'test',
        platforms: ['linkedin'],
        tone: 'professional',
        provider: 'openai',
        model: 'gpt-4o-mini',
        language: 'English',
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('event: text-delta');
    expect(response.text).toContain('"content":"Hello world"');
    expect(response.text).toContain('event: done');
    expect(response.text).toContain('"result":{"content":"Hello world"');
  });
});
