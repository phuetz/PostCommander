import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listPlatforms,
  startAuth,
  handleCallback,
  disconnectPlatform,
} from '../controllers/platforms.controller.js';
import { emptyBodySchema } from '../schemas/routes.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listPlatforms);
router.get('/:platform/auth', startAuth);
router.get('/:platform/callback', handleCallback);
router.delete('/:platform/disconnect', validate(emptyBodySchema), disconnectPlatform);

export default router;
