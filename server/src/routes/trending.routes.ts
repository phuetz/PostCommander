import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  trendingSchema,
  handleTrending,
} from '../controllers/trending.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireFeature('trending'), validate(trendingSchema), handleTrending);

export default router;
