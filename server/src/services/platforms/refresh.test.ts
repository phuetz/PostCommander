import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const refreshSpy = vi.hoisted(() => vi.fn());

vi.mock('./linkedin.js', () => ({
  LinkedInAdapter: class {
    readonly platformId = 'linkedin';
    readonly name = 'LinkedIn';
    getAuthUrl() {
      return '';
    }
    async exchangeCode() {
      return { accessToken: '' };
    }
    refreshToken = refreshSpy;
    async publishPost() {
      return { platformPostId: '', platformUrl: '' };
    }
    async getAccountInfo() {
      return { accountId: '', accountName: '' };
    }
  },
}));

import { getDrizzle } from '../../db/connection.js';
import { platformConnections as connectionsTable } from '../../db/schema.js';
import { encryptSecret } from '../../utils/secret-crypto.js';
import {
  closeTestDatabase,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../../test-utils/test-db.js';
import { ensureFreshToken } from './index.js';

describe('ensureFreshToken', () => {
  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    refreshSpy.mockReset();
    resetTestDatabase();
  });

  async function seedConnection(opts: {
    accessToken: string;
    refreshToken: string | null;
    tokenExpires: string | null;
  }) {
    const user = await createTestUser({ email: `tok-${Date.now()}@example.com` });
    const db = getDrizzle();
    const id = crypto.randomUUID();
    await db.insert(connectionsTable).values({
      id,
      userId: user.id,
      platform: 'linkedin',
      accessToken: encryptSecret(opts.accessToken),
      refreshToken: opts.refreshToken ? encryptSecret(opts.refreshToken) : null,
      tokenExpires: opts.tokenExpires,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const [row] = await db
      .select()
      .from(connectionsTable)
      .where(eq(connectionsTable.id, id))
      .limit(1);
    return row;
  }

  it('returns the existing token when expiry is far in the future', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const row = await seedConnection({
      accessToken: 'still-good',
      refreshToken: 'r1',
      tokenExpires: future,
    });

    const token = await ensureFreshToken({
      id: row.id,
      platform: row.platform,
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      tokenExpires: row.tokenExpires,
    });

    expect(token).toBe('still-good');
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('refreshes when token expires within the threshold and persists new tokens', async () => {
    const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString(); // 1 min away
    const row = await seedConnection({
      accessToken: 'old',
      refreshToken: 'old-refresh',
      tokenExpires: soonExpiry,
    });

    refreshSpy.mockResolvedValueOnce({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
    });

    const token = await ensureFreshToken({
      id: row.id,
      platform: row.platform,
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      tokenExpires: row.tokenExpires,
    });

    expect(token).toBe('new-access');
    expect(refreshSpy).toHaveBeenCalledWith('old-refresh');

    const db = getDrizzle();
    const [updated] = await db
      .select()
      .from(connectionsTable)
      .where(eq(connectionsTable.id, row.id))
      .limit(1);
    // accessToken should be re-encrypted (not literal "new-access")
    expect(updated.accessToken).not.toBe('new-access');
    expect(updated.accessToken).not.toBe(row.accessToken);
    expect(updated.tokenExpires).not.toBe(soonExpiry);
  });

  it('falls back to existing token when refresh throws', async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const row = await seedConnection({
      accessToken: 'expired',
      refreshToken: 'r1',
      tokenExpires: past,
    });

    refreshSpy.mockRejectedValueOnce(new Error('refresh denied'));

    const token = await ensureFreshToken({
      id: row.id,
      platform: row.platform,
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      tokenExpires: row.tokenExpires,
    });

    expect(token).toBe('expired');
  });

  it('returns the token unchanged when no refresh_token is stored', async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const row = await seedConnection({
      accessToken: 'expired-no-refresh',
      refreshToken: null,
      tokenExpires: past,
    });

    const token = await ensureFreshToken({
      id: row.id,
      platform: row.platform,
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      tokenExpires: row.tokenExpires,
    });

    expect(token).toBe('expired-no-refresh');
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
