import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { getDrizzle } from '../db/connection.js';
import { config } from '../config/env.js';

vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(() => ({ prepare: () => ({ get: () => undefined }) })),
  getDrizzle: vi.fn(),
  initDb: vi.fn(),
  closeDb: vi.fn(),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(async ({ messages }) => {
    const userMsg = Array.isArray(messages) ? messages[0]?.content || '' : '';
    if (userMsg.includes('variantes')) {
      return { text: '1) Une idée principale\n2) Une alternative A\n3) Une alternative B' };
    }
    return { text: 'Réponse principale du LLM' };
  }),
}));

vi.mock('../services/llm/provider-factory.js', () => ({
  createModel: vi.fn(() => ({ provider: 'fake', model: 'fake' })),
}));

const mockDrizzle = {
  query: {
    users: {
      findFirst: vi.fn(),
    },
    workspaceMembers: {
      findFirst: vi.fn(),
    },
  },
};

(getDrizzle as unknown as { mockReturnValue: (value: typeof mockDrizzle) => void }).mockReturnValue(
  mockDrizzle,
);

const { createApp } = await import('../app.js');
const app = createApp();

const generateAuthToken = () => jwt.sign({ userId: 'test-user-assist' }, config.JWT_SECRET);

describe('POST /api/assist/field', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDrizzle.query.users.findFirst.mockResolvedValue({
      id: 'test-user-assist',
      email: 'assist@example.com',
      plan: 'free',
      planStatus: 'active',
    });
  });

  it('returns 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/assist/field')
      .send({ field: 'topic', context: {} });
    expect(response.status).toBe(401);
  });

  it('returns 400 when field is unknown', async () => {
    const token = generateAuthToken();
    const response = await request(app)
      .post('/api/assist/field')
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'unknown_field', context: {} });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Validation');
  });

  it('returns single suggestion for tone field', async () => {
    const token = generateAuthToken();
    const response = await request(app)
      .post('/api/assist/field')
      .set('Authorization', `Bearer ${token}`)
      .send({
        field: 'tone',
        context: { topic: 'IA générative', audience: 'devs' },
        provider: 'openai',
        model: 'gpt-4o-mini',
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.suggestion).toBe('Réponse principale du LLM');
    expect(response.body.data.alternatives).toBeUndefined();
  });

  it('returns suggestion + alternatives for topic field', async () => {
    const token = generateAuthToken();
    const response = await request(app)
      .post('/api/assist/field')
      .set('Authorization', `Bearer ${token}`)
      .send({
        field: 'topic',
        context: { audience: 'CTO B2B' },
        provider: 'openai',
        model: 'gpt-4o-mini',
      });
    expect(response.status).toBe(200);
    expect(response.body.data.suggestion).toBe('Une idée principale');
    expect(response.body.data.alternatives).toEqual([
      'Une alternative A',
      'Une alternative B',
    ]);
  });
});
