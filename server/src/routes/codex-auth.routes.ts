import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  handleStart,
  handleStatus,
  handleLogout,
} from '../controllers/codex-auth.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/start', handleStart);
router.get('/status', handleStatus);
router.post('/logout', handleLogout);

export default router;
