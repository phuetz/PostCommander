import { Router } from 'express';
import { requireFeature } from '../middleware/plan-limiter.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getOverview,
  getBestTimes,
  getSocialComments,
  generateCommentReply,
  scoreComment,
  runAgentStep,
} from '../controllers/analytics.controller.js';
import {
  llmConfigBaseSchema,
  analyticsAgentStepSchema,
  emptyBodySchema,
} from '../schemas/routes.js';

const router = Router();

router.use(authMiddleware);

router.get('/overview', requireFeature('analytics'), getOverview);
router.get('/best-times', requireFeature('analytics'), getBestTimes);

router.get('/comments', requireFeature('analytics'), getSocialComments);
router.post(
  '/comments/:id/reply',
  requireFeature('analytics'),
  validate(llmConfigBaseSchema),
  generateCommentReply,
);
router.post(
  '/comments/:id/score',
  requireFeature('analytics'),
  validate(llmConfigBaseSchema),
  scoreComment,
);
router.post(
  '/comments/:id/agent-step',
  requireFeature('analytics'),
  validate(analyticsAgentStepSchema),
  runAgentStep,
);

// Manual trigger for the evergreen recycling worker. Gated by the analytics
// feature flag so free-tier users can't fire-and-forget LLM-heavy jobs at will.
router.post('/trigger-evergreen', requireFeature('analytics'), validate(emptyBodySchema), async (_req, res) => {
  const { runEvergreenRecycling } = await import('../workers/evergreen.worker.js');
  // Fire-and-forget: the worker is long-running and the HTTP response shouldn't block.
  void runEvergreenRecycling();
  res.json({ success: true, message: 'Evergreen worker started' });
});

export default router;
