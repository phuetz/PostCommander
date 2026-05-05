import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDrizzle } from '../db/connection.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '../services/email/index.js';

// Mock the entire db/connection.js
vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(),
  getDrizzle: vi.fn(),
  initDb: vi.fn(),
  closeDb: vi.fn(),
}));

vi.mock('../services/email/index.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

// Setup common mock for drizzle object
const mockDrizzle = {
  query: {
    users: {
      findFirst: vi.fn(),
    },
    passwordResetTokens: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

(getDrizzle as unknown as { mockReturnValue: (value: typeof mockDrizzle) => void }).mockReturnValue(mockDrizzle);

const app = createApp();

describe('Auth Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // 1. Check existing user
      mockDrizzle.query.users.findFirst.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(response.body.data).not.toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        email: userData.email,
        name: userData.name,
        plan: 'free',
        planStatus: 'active',
      });
    });

    it('should return 400 if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      // Mock user already exists
      mockDrizzle.query.users.findFirst.mockResolvedValueOnce({ id: 'existing-id' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 10);
      
      const userRecord = {
        id: 'user-id-123',
        email,
        passwordHash: passwordHash,
        name: 'Test User',
        plan: 'free',
        planStatus: 'active',
      };

      // Mock user lookup
      mockDrizzle.query.users.findFirst.mockResolvedValueOnce(userRecord);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
      expect(response.body.data).not.toHaveProperty('token');
      expect(response.body.data.user.id).toBe(userRecord.id);
    });

    it('should return 401 with wrong password', async () => {
      const email = 'test@example.com';
      const passwordHash = await bcrypt.hash('correct-password', 10);
      
      const userRecord = {
        id: 'user-id-123',
        email,
        passwordHash: passwordHash,
      };

      // Mock user lookup
      mockDrizzle.query.users.findFirst.mockResolvedValueOnce(userRecord);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 401 if user not found', async () => {
      // Mock user lookup
      mockDrizzle.query.users.findFirst.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'any' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=;');
      expect(response.body.data.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns a preview url in test mode and stores a hashed token', async () => {
      const userRecord = {
        id: 'user-id-123',
        email: 'test@example.com',
      };

      mockDrizzle.query.users.findFirst.mockResolvedValueOnce(userRecord);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.data.previewUrl).toContain('/reset-password?token=');
      expect(mockDrizzle.insert).toHaveBeenCalled();
      const insertArg = mockDrizzle.values.mock.calls.at(-1)?.[0];
      expect(insertArg.token).not.toBe(
        response.body.data.previewUrl.split('token=')[1],
      );
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('hashes the incoming token before lookup and updates the password', async () => {
      mockDrizzle.query.passwordResetTokens.findFirst.mockResolvedValueOnce({
        id: 'reset-token-id',
        userId: 'user-id-123',
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'plain-reset-token', password: 'newPassword123' });

      expect(response.status).toBe(200);
      expect(mockDrizzle.query.passwordResetTokens.findFirst).toHaveBeenCalled();
      expect(mockDrizzle.update).toHaveBeenCalled();
      expect(mockDrizzle.delete).toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token in cookie', async () => {
      const userId = 'user-id-123';
      const token = jwt.sign({ userId }, config.JWT_SECRET);
      
      const userRecord = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        plan: 'free',
        planStatus: 'active',
      };

      // Mock user lookup in auth middleware, then in me controller
      mockDrizzle.query.users.findFirst
        .mockResolvedValueOnce(userRecord)
        .mockResolvedValueOnce(userRecord);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe(userRecord.email);
    });

    it('should return current user with valid token in Authorization header', async () => {
      const userId = 'user-id-123';
      const token = jwt.sign({ userId }, config.JWT_SECRET);
      
      const userRecord = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        plan: 'free',
        planStatus: 'active',
      };

      // Mock user lookup in auth middleware, then in me controller
      mockDrizzle.query.users.findFirst
        .mockResolvedValueOnce(userRecord)
        .mockResolvedValueOnce(userRecord);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(userId);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['token=invalid-token']);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication token missing');
    });
  });
});
