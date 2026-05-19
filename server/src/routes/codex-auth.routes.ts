import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  handleStart,
  handleStatus,
  handleLogout,
} from '../controllers/codex-auth.controller.js';
import { emptyBodySchema } from '../schemas/routes.js';

const router = Router();

router.use(authMiddleware);

router.post('/start', validate(emptyBodySchema), handleStart);
router.get('/status', handleStatus);
router.post('/logout', validate(emptyBodySchema), handleLogout);

export default router;
