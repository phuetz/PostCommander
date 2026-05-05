import { Router } from 'express';
import { requireFeature } from '../middleware/plan-limiter.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  getOverview,
  getBestTimes,
  getSocialComments,
  generateCommentReply,
  scoreComment,
  runAgentStep,
} from '../controllers/analytics.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/overview', requireFeature('analytics'), getOverview);
router.get('/best-times', requireFeature('analytics'), getBestTimes);

router.get('/comments', requireFeature('analytics'), getSocialComments);
router.post('/comments/:id/reply', requireFeature('analytics'), generateCommentReply);
router.post('/comments/:id/score', requireFeature('analytics'), scoreComment);
router.post('/comments/:id/agent-step', requireFeature('analytics'), runAgentStep);

// Route temporaire pour déclencher manuellement le worker Evergreen
router.post('/trigger-evergreen', async (req, res) => {
  const { runEvergreenRecycling } = await import('../workers/evergreen.worker.js');
  runEvergreenRecycling(); // On l'exécute en asynchrone
  res.json({ success: true, message: 'Evergreen worker started' });
});

export default router;
