import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDrizzle } from '../db/connection.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(),
  getDrizzle: vi.fn(),
  initDb: vi.fn(),
  closeDb: vi.fn(),
}));

const mockDrizzle = {
  select: vi.fn(),
  query: {
    users: {
      findFirst: vi.fn(),
    },
  },
};

(getDrizzle as unknown as { mockReturnValue: (value: typeof mockDrizzle) => void }).mockReturnValue(
  mockDrizzle,
);

const app = createApp();

const generateAuthToken = () => {
  return jwt.sign({ userId: 'test-user-123' }, config.JWT_SECRET);
};

describe('Analytics Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock user authentication lookup inside auth middleware
    mockDrizzle.query.users.findFirst.mockResolvedValue({
      id: 'test-user-123',
      email: 'test@example.com',
      plan: 'business',
      planStatus: 'active',
    });

    // Reset mockDrizzle.select before each test
    mockDrizzle.select.mockReset();
  });

  describe('GET /api/analytics/overview', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/analytics/overview');
      expect(response.status).toBe(401);
    });

    it('should return analytics overview when authenticated', async () => {
      const token = generateAuthToken();

      // Setup sequential mocks for the 6 queries in getOverview
      // 1. Total posts
      // 2. By status
      // 3. By platform
      // 4. By tone
      // 5. Posts per week
      // 6. Recent activity

      const mockResult = (data: unknown[]) => ({
        from: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown[]) => unknown) => resolve(data),
        [Symbol.iterator]: function* () {
          yield* data;
        },
      });

      mockDrizzle.select
        .mockReturnValueOnce(mockResult([{ count: 15 }])) // total
        .mockReturnValueOnce(mockResult([{ status: 'published', count: 8 }])) // status
        .mockReturnValueOnce(mockResult([{ platforms: '["linkedin"]' }])) // platforms
        .mockReturnValueOnce(mockResult([{ tone: 'professional', count: 10 }])) // tone
        .mockReturnValueOnce(mockResult([{ week: '2023-W01', count: 5 }])) // week
        .mockReturnValueOnce(mockResult([{ date: '2023-01-01', count: 2 }])); // activity

      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
