import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import {
  users as usersTable,
  subscriptions as subscriptionsTable,
  passwordResetTokens as tokensTable,
} from '../db/schema.js';
import { config } from '../config/env.js';
import { catchAsync } from '../utils/catch-async.js';
import { AppError } from '../middleware/error-handler.js';
import { RegisterInput, LoginInput, DeleteAccountInput, ApiResponse } from '@postcommander/shared';
import { sendPasswordResetEmail } from '../services/email/index.js';
import { exportAccountData, deleteAccountData } from '../services/account/index.js';
import { cancelSubscriptionImmediately } from '../services/stripe/index.js';

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function omitPasswordHash<T extends { passwordHash?: string | null }>(
  user: T,
): Omit<T, 'passwordHash'> {
  const sanitizedUser = { ...user };
  delete sanitizedUser.passwordHash;
  return sanitizedUser;
}

export const AuthController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const { email, password, name } = req.body as RegisterInput;

    const db = getDrizzle();
    const existingUser = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (existingUser) {
      throw new AppError(400, 'Email already in use');
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await db.insert(usersTable).values({
      id,
      email,
      passwordHash,
      name,
      plan: 'free',
      planStatus: 'active',
      postsUsedThisMonth: 0,
      createdAt: now,
      updatedAt: now,
    });

    const token = jwt.sign({ userId: id }, config.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id,
          email,
          name,
          avatarUrl: null,
          role: 'user',
          plan: 'free',
          planStatus: 'active',
          postsUsedThisMonth: 0,
          postsResetDate: null,
          createdAt: now,
          updatedAt: now,
        },
      },
    };

    res.status(201).json(response);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginInput;

    const db = getDrizzle();
    const user = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userWithoutPassword = omitPasswordHash(user);

    const response: ApiResponse = {
      success: true,
      data: {
        user: userWithoutPassword,
      },
    };

    res.json(response);
  }),

  devLogin: catchAsync(async (_req: Request, res: Response) => {
    if (config.NODE_ENV === 'production' || !config.DEV_AUTO_LOGIN_EMAIL) {
      throw new AppError(404, 'Not found');
    }

    const email = config.DEV_AUTO_LOGIN_EMAIL.toLowerCase();
    const db = getDrizzle();
    let user = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) {
      const id = uuidv4();
      const now = new Date().toISOString();
      await db.insert(usersTable).values({
        id,
        email,
        passwordHash: null,
        name: email.split('@')[0],
        plan: 'free',
        planStatus: 'active',
        postsUsedThisMonth: 0,
        createdAt: now,
        updatedAt: now,
      });
      user = await db.query.users.findFirst({ where: eq(usersTable.id, id) });
      if (!user) throw new AppError(500, 'Failed to provision dev user');
    }

    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const response: ApiResponse = {
      success: true,
      data: { user: omitPasswordHash(user) },
    };

    res.json(response);
  }),

  logout: catchAsync(async (_req: Request, res: Response) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Logged out successfully' },
    };

    res.json(response);
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const db = getDrizzle();

    const user = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (user) {
      // 1. Delete any existing tokens for this user
      await db.delete(tokensTable).where(eq(tokensTable.userId, user.id));

      // 2. Generate a random hex token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = hashResetToken(resetToken);
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      // 3. Save token to DB
      await db.insert(tokensTable).values({
        id: uuidv4(),
        userId: user.id,
        token: resetTokenHash,
        expiresAt,
      });

      if (config.NODE_ENV === 'test') {
        res.json({
          success: true,
          data: {
            message: 'If an account exists with this email, a reset link has been sent.',
            previewUrl: `${config.CLIENT_URL}/reset-password?token=${resetToken}`,
          },
        });
        return;
      }

      await sendPasswordResetEmail({
        email,
        resetUrl: `${config.CLIENT_URL}/reset-password?token=${resetToken}`,
      });
    }

    res.json({
      success: true,
      data: { message: 'If an account exists with this email, a reset link has been sent.' },
    });
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const tokenHash = hashResetToken(token);
    const db = getDrizzle();

    // 1. Find valid token
    const tokenRecord = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(tokensTable.token, tokenHash),
        gt(tokensTable.expiresAt, new Date().toISOString()),
      ),
    });

    if (!tokenRecord) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // 2. Update user password
    const passwordHash = await bcrypt.hash(password, 10);
    await db
      .update(usersTable)
      .set({ passwordHash, updatedAt: new Date().toISOString() })
      .where(eq(usersTable.id, tokenRecord.userId));

    // 3. Delete token
    await db.delete(tokensTable).where(eq(tokensTable.id, tokenRecord.id));

    res.json({
      success: true,
      data: { message: 'Password has been reset successfully. You can now login.' },
    });
  }),

  me: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const db = getDrizzle();
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, req.user.id),
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const userWithoutPassword = omitPasswordHash(user);

    const response: ApiResponse = {
      success: true,
      data: {
        user: userWithoutPassword,
      },
    };

    res.json(response);
  }),

  exportData: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const payload = await exportAccountData(req.user.id);
    const filename = `postcommander-export-${req.user.id}-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(payload);
  }),

  deleteAccount: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const { password } = req.body as DeleteAccountInput;
    const db = getDrizzle();
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, req.user.id),
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.passwordHash) {
      throw new AppError(400, 'Account deletion is unavailable for this authentication method');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, 'Invalid password');
    }

    const subscriptions = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, user.id),
          inArray(subscriptionsTable.status, ['active', 'trialing', 'past_due']),
        ),
      );

    for (const subscription of subscriptions) {
      await cancelSubscriptionImmediately(subscription.stripeSubscriptionId);
      await db
        .update(subscriptionsTable)
        .set({
          status: 'canceled',
          cancelAtPeriodEnd: false,
          canceledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(subscriptionsTable.id, subscription.id));
    }

    await deleteAccountData(user.id);

    res.clearCookie('token', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    });
  }),
};
