import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';
import { config } from '../config/env.js';
import { getDrizzle } from '../db/connection.js';
import { users as usersTable, workspaceMembers as workspaceMembersTable } from '../db/schema.js';
import { logger } from '../utils/logger.js';

function getAdminEmails(): Set<string> {
  return new Set(
    (config.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Check cookies first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const db = getDrizzle();

    db.query.users
      .findFirst({
        where: eq(usersTable.id, decoded.userId),
      })
      .then((user) => {
        if (!user) {
          res.status(401).json({ error: 'Invalid or expired token' });
          return;
        }

        req.user = {
          id: user.id,
          email: user.email,
          role:
            user.role === 'admin' || getAdminEmails().has(user.email.toLowerCase())
              ? 'admin'
              : 'user',
          plan: user.plan as 'free' | 'pro' | 'business',
          planStatus: user.planStatus as 'active' | 'past_due' | 'canceled' | 'trialing',
          postsUsedThisMonth: user.postsUsedThisMonth ?? 0,
          postsResetDate: user.postsResetDate ?? null,
        };

        const workspaceId = req.headers['x-workspace-id'] as string;

        if (workspaceId) {
          db.query.workspaceMembers
            .findFirst({
              where: and(
                eq(workspaceMembersTable.workspaceId, workspaceId),
                eq(workspaceMembersTable.userId, user.id),
              ),
            })
            .then((member) => {
              if (member) {
                req.workspaceId = workspaceId;
              }
              next();
            })
            .catch((err) => {
              logger.error({ err }, 'Failed to verify workspace membership');
              next(); // Still proceed, just without workspaceId
            });
        } else {
          next();
        }
      })
      .catch((err) => {
        logger.error({ err }, 'Failed to load authenticated user');
        res.status(500).json({ error: 'Authentication lookup failed' });
      });
  } catch (err) {
    logger.error({ err }, 'JWT verification failed');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
