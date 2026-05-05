import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import {
  closeTestDatabase,
  createAuthCookie,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';

describe('Admin routes', () => {
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

  it('rejects non-admin users from Bull Board', async () => {
    const user = await createTestUser({ email: 'member@example.com', role: 'user' });

    const response = await request(app)
      .get('/api/admin/queues')
      .set('Cookie', createAuthCookie(user.id));

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Admin access required');
  });

  it('allows admin users to access Bull Board', async () => {
    const admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });

    const response = await request(app)
      .get('/api/admin/queues')
      .set('Cookie', createAuthCookie(admin.id));

    expect(response.status).toBe(200);
    expect(response.text).toContain('Bull Dashboard');
  });
});
