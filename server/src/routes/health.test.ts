import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { initDb, closeDb } from '../db/connection.js';
import type { Express } from 'express';

const queueHealthMock = vi.hoisted(() => vi.fn());

vi.mock('../services/jobs/queue.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/jobs/queue.js')>();
  return {
    ...actual,
    getQueueHealth: queueHealthMock,
  };
});

import { createApp } from '../app.js';

describe('Health API', () => {
  let app: Express;

  beforeAll(() => {
    initDb();
    app = createApp() as Express;
  });

  afterAll(() => {
    closeDb();
  });

  beforeEach(() => {
    queueHealthMock.mockResolvedValue({
      redis: 'ok',
      queue: 'ok',
    });
  });

  it('returns ok when database and queue are healthy', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('database', 'ok');
    expect(response.body).toHaveProperty('redis', 'ok');
    expect(response.body).toHaveProperty('queue', 'ok');
    expect(response.body).toHaveProperty('uptime');
  });

  it('returns live when the process is running', async () => {
    queueHealthMock.mockResolvedValue({
      redis: 'error',
      queue: 'error',
      details: 'Redis unavailable',
    });

    const response = await request(app).get('/api/live');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
  });

  it('returns degraded when queue health is degraded', async () => {
    queueHealthMock.mockResolvedValue({
      redis: 'error',
      queue: 'error',
      details: 'Redis unavailable',
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'degraded');
    expect(response.body).toHaveProperty('database', 'ok');
    expect(response.body).toHaveProperty('redis', 'error');
    expect(response.body).toHaveProperty('queue', 'error');
    expect(response.body).toHaveProperty('queueDetails', 'Redis unavailable');
  });
});
