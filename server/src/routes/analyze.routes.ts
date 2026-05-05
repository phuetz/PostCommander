import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  engagementSchema,
  simulateSchema,
} from '@postcommander/shared';
import {
  handleEngagement,
  handleSimulate,
} from '../controllers/analyze.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/engagement', requireFeature('engagement'), validate(engagementSchema), handleEngagement);
router.post('/simulate', requireFeature('simulator'), validate(simulateSchema), handleSimulate);

export default router;
