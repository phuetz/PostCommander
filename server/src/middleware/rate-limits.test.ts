import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('rate-limits middleware', () => {
  // The middleware skips itself when NODE_ENV === 'test'. To exercise it, we
  // temporarily flip NODE_ENV inside the test and re-import the module fresh.
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.resetModules();
  });

  async function loadLimiterUnderEnv(env: 'development' | 'test') {
    process.env.NODE_ENV = env;
    vi.resetModules();
    return await import('./rate-limits.js');
  }

  it('blocks the 6th rapid auth request from the same IP within a minute', async () => {
    const { authRateLimit } = await loadLimiterUnderEnv('development');

    const app = express();
    app.use(express.json());
    app.post('/auth/test', authRateLimit, (_req, res) => {
      res.json({ success: true });
    });

    for (let i = 0; i < 5; i += 1) {
      const ok = await request(app).post('/auth/test');
      expect(ok.status).toBe(200);
    }

    const blocked = await request(app).post('/auth/test');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      success: false,
      error: expect.stringContaining('authentication'),
    });
  });

  it('skips entirely when NODE_ENV=test (no 429 for 50 requests)', async () => {
    const { authRateLimit } = await loadLimiterUnderEnv('test');

    const app = express();
    app.post('/auth/test', authRateLimit, (_req, res) => {
      res.json({ success: true });
    });

    for (let i = 0; i < 50; i += 1) {
      const r = await request(app).post('/auth/test');
      expect(r.status).toBe(200);
    }
  });

  it('allows 10 generate calls then 429s the 11th', async () => {
    const { generateRateLimit } = await loadLimiterUnderEnv('development');

    const app = express();
    app.post('/generate/test', generateRateLimit, (_req, res) => {
      res.json({ success: true });
    });

    for (let i = 0; i < 10; i += 1) {
      const ok = await request(app).post('/generate/test');
      expect(ok.status).toBe(200);
    }
    const blocked = await request(app).post('/generate/test');
    expect(blocked.status).toBe(429);
  });
});
