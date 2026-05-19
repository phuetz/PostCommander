import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authRateLimit } from '../middleware/rate-limits.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deleteAccountSchema,
} from '@postcommander/shared';
import { emptyBodySchema } from '../schemas/routes.js';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimit, validate(loginSchema), AuthController.login);
// dev-login takes no body — it auto-logs as DEV_AUTO_LOGIN_EMAIL (gated server-side).
router.post('/dev-login', authRateLimit, validate(emptyBodySchema), AuthController.devLogin);
router.post('/logout', validate(emptyBodySchema), AuthController.logout);
router.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);
router.get('/me', authMiddleware, AuthController.me);
router.get('/export', authMiddleware, AuthController.exportData);
router.delete(
  '/account',
  authMiddleware,
  validate(deleteAccountSchema),
  AuthController.deleteAccount,
);

export default router;
