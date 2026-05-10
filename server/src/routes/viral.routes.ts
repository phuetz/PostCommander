import { Router } from 'express';
import { viralQuerySchema, viralSearchSchema } from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  listViralPosts,
  listViralCategories,
  searchViral,
} from '../controllers/viral.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireFeature('viral_library'), validateQuery(viralQuerySchema), listViralPosts);
router.get('/categories', requireFeature('viral_library'), listViralCategories);
router.get(
  '/search',
  requireFeature('viral_library'),
  validateQuery(viralSearchSchema),
  searchViral,
);

export default router;
