import crypto from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../app.js';
import { getDrizzle } from '../db/connection.js';
import { settings as settingsTable } from '../db/schema.js';
import { encryptSecret } from '../utils/secret-crypto.js';
import {
  closeTestDatabase,
  createAuthCookie,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';

describe('Settings Routes', () => {
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
    const response = await request(app).get('/api/settings');

    expect(response.status).toBe(401);
  });

  it('returns only the authenticated user settings and masks sensitive values', async () => {
    const db = getDrizzle();
    const userA = await createTestUser({ email: 'alice@example.com' });
    const userB = await createTestUser({ email: 'bob@example.com' });

    await db.insert(settingsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        key: 'defaultTone',
        value: 'casual',
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        key: 'openaiApiKey',
        value: encryptSecret('sk-alice-secret-1234'),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        key: 'defaultTone',
        value: 'professional',
        updatedAt: new Date().toISOString(),
      },
    ]);

    const response = await request(app)
      .get('/api/settings')
      .set('Cookie', createAuthCookie(userA.id));

    expect(response.status).toBe(200);
    expect(response.body.data.defaultTone).toBe('casual');
    expect(response.body.data.openaiApiKey).toBe('sk-a...1234');
    expect(response.body.data._hasKeys.openaiApiKey).toBe(true);
    expect(response.body.data).not.toHaveProperty('professional');
  });

  it('updates only the authenticated user settings and stores secrets encrypted', async () => {
    const db = getDrizzle();
    const userA = await createTestUser({ email: 'alice@example.com' });
    const userB = await createTestUser({ email: 'bob@example.com' });

    await db.insert(settingsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        key: 'defaultTone',
        value: 'professional',
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        key: 'defaultTone',
        value: 'educational',
        updatedAt: new Date().toISOString(),
      },
    ]);

    const response = await request(app)
      .put('/api/settings')
      .set('Cookie', createAuthCookie(userA.id))
      .send({
        defaultTone: 'casual',
        openaiApiKey: 'sk-live-new-secret-9876',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.defaultTone).toBe('casual');
    expect(response.body.data.openaiApiKey).toBe('sk-l...9876');

    const aliceTone = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userA.id));
    const bobTone = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userB.id));

    expect(aliceTone.find((row) => row.key === 'defaultTone')?.value).toBe('casual');
    expect(bobTone.find((row) => row.key === 'defaultTone')?.value).toBe('educational');

    const storedSecret = aliceTone.find((row) => row.key === 'openaiApiKey');
    expect(storedSecret?.value).not.toBe('sk-live-new-secret-9876');
    expect(storedSecret?.value.startsWith('enc:v1:')).toBe(true);
  });
});
