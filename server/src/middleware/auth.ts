import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';
import { config } from '../config/env.js';
import { getDrizzle } from '../db/connection.js';
import {
  users as usersTable,
  workspaceMembers as workspaceMembersTable,
  revokedTokens as revokedTokensTable,
} from '../db/schema.js';
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
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string; jti?: string };
    const db = getDrizzle();

    // Revocation check: if the token has a jti and that jti appears in
    // revoked_tokens, refuse the request as if the cookie had expired.
    // (Tokens issued before the revocation table was introduced have no jti
    // and skip this check — they remain valid until their natural expiry.)
    const revocationGuard: Promise<void> = decoded.jti
      ? db.query.revokedTokens
          .findFirst({ where: eq(revokedTokensTable.jti, decoded.jti) })
          .then((revoked) => {
            if (revoked) {
              const err = new Error('Token revoked');
              (err as Error & { code?: string }).code = 'TOKEN_REVOKED';
              throw err;
            }
          })
      : Promise.resolve();

    revocationGuard
      .then(() => db.query.users.findFirst({ where: eq(usersTable.id, decoded.userId) }))
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
                next();
                return;
              }
              // Not a member → 403 explicit. Falling through to next() without
              // workspaceId was masking authorization failures and surfacing as
              // "row not found" later in downstream handlers.
              res.status(403).json({ error: 'Not a member of this workspace' });
            })
            .catch((err) => {
              // DB failure while checking membership is a server error — fail
              // explicit rather than silently continuing without workspace scope.
              logger.error({ err, workspaceId, userId: user.id }, 'Failed to verify workspace membership');
              res.status(500).json({ error: 'Workspace membership lookup failed' });
            });
        } else {
          next();
        }
      })
      .catch((err) => {
        if ((err as Error & { code?: string }).code === 'TOKEN_REVOKED') {
          res.status(401).json({ error: 'Token revoked' });
          return;
        }
        logger.error({ err }, 'Failed to load authenticated user');
        res.status(500).json({ error: 'Authentication lookup failed' });
      });
  } catch (err) {
    logger.error({ err }, 'JWT verification failed');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
