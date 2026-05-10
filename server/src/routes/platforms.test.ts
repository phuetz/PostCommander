import crypto from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';

const mockedAdapter = vi.hoisted(() => ({
  getAuthUrl: vi.fn((state: string) => `https://example.test/oauth?state=${state}`),
  exchangeCode: vi.fn(async () => ({
    accessToken: 'platform-access-token',
    refreshToken: 'platform-refresh-token',
    expiresAt: Date.now() + 3600_000,
    scopes: 'publish,read',
  })),
  getAccountInfo: vi.fn(async () => ({
    accountName: 'Alice Account',
  })),
}));

vi.mock('../services/platforms/index.js', () => ({
  getPlatform: vi.fn(() => mockedAdapter),
}));

import { createApp } from '../app.js';
import { getDrizzle } from '../db/connection.js';
import { platformConnections as connectionsTable } from '../db/schema.js';
import {
  closeTestDatabase,
  createAuthToken,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';

describe('Platforms Routes', () => {
  const app = createApp();

  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestDatabase();
  });

  it('requires authentication for list', async () => {
    const response = await request(app).get('/api/platforms');
    expect(response.status).toBe(401);
  });

  it('stores and validates OAuth state before saving a user-scoped encrypted connection', async () => {
    const db = getDrizzle();
    const user = await createTestUser({ email: 'alice@example.com' });
    const agent = request.agent(app);
    const authToken = createAuthToken(user.id);

    const authStart = await agent
      .get('/api/platforms/linkedin/auth')
      .set('Authorization', `Bearer ${authToken}`);

    expect(authStart.status).toBe(200);
    expect(authStart.body.data.authUrl).toContain('state=');

    const callback = await agent
      .get(
        `/api/platforms/linkedin/callback?code=oauth-code&state=${encodeURIComponent(authStart.body.data.state)}`,
      )
      .set('Authorization', `Bearer ${authToken}`);

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain('/app/settings');
    expect(mockedAdapter.exchangeCode).toHaveBeenCalledWith('oauth-code');

    const [connection] = await db
      .select()
      .from(connectionsTable)
      .where(eq(connectionsTable.userId, user.id))
      .limit(1);

    expect(connection.platform).toBe('linkedin');
    expect(connection.accountName).toBe('Alice Account');
    expect(connection.accessToken).not.toBe('platform-access-token');
    expect(connection.accessToken.startsWith('enc:v1:')).toBe(true);
  });

  it('rejects callbacks with an invalid state token', async () => {
    const db = getDrizzle();
    const user = await createTestUser({ email: 'alice@example.com' });
    const agent = request.agent(app);
    const authToken = createAuthToken(user.id);

    await agent.get('/api/platforms/linkedin/auth').set('Authorization', `Bearer ${authToken}`);

    const callback = await agent
      .get('/api/platforms/linkedin/callback?code=oauth-code&state=wrong-state')
      .set('Authorization', `Bearer ${authToken}`);

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain('error=invalid_state');

    const rows = await db.select().from(connectionsTable);
    expect(rows).toHaveLength(0);
  });

  it('lists only the authenticated user connections', async () => {
    const db = getDrizzle();
    const userA = await createTestUser({ email: 'alice@example.com' });
    const userB = await createTestUser({ email: 'bob@example.com' });

    await db.insert(connectionsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        platform: 'linkedin',
        accountName: 'Alice LinkedIn',
        accessToken: 'enc:v1:alice',
        refreshToken: null,
        tokenExpires: null,
        scopes: null,
        metadata: null,
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        platform: 'twitter',
        accountName: 'Bob Twitter',
        accessToken: 'enc:v1:bob',
        refreshToken: null,
        tokenExpires: null,
        scopes: null,
        metadata: null,
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const response = await request(app)
      .get('/api/platforms')
      .set('Authorization', `Bearer ${createAuthToken(userA.id)}`);

    expect(response.status).toBe(200);
    const connected = response.body.data.filter((row: { connected: boolean }) => row.connected);
    expect(connected).toHaveLength(1);
    expect(connected[0].connection.platform).toBe('linkedin');
  });
});
