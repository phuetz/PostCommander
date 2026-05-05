import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleGetWorkspaces } from '../controllers/workspaces.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', handleGetWorkspaces);

export default router;
