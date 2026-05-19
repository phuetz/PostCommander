import { Router } from 'express';
import { getDb } from '../db/connection.js';
import generateRoutes from './generate.routes.js';
import postsRoutes from './posts.routes.js';
import platformsRoutes from './platforms.routes.js';
import settingsRoutes from './settings.routes.js';
import viralRoutes from './viral.routes.js';
import templatesRoutes from './templates.routes.js';
import stylesRoutes from './styles.routes.js';
import imagesRoutes from './images.routes.js';
import analyticsRoutes from './analytics.routes.js';
import analyzeRoutes from './analyze.routes.js';
import trendingRoutes from './trending.routes.js';
import pillarsRoutes from './pillars.routes.js';
import stripeRoutes from './stripe.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import workspacesRoutes from './workspaces.routes.js';
import { setupBullBoard } from '../middleware/bull-board.js';
import { getQueueHealth } from '../services/jobs/queue.js';
import agentRoutes from './agent.routes.js';
import autoBlogRoutes from './autoblog.routes.js';
import inboxRoutes from './inbox.routes.js';
import assistRoutes from './assist.routes.js';
import codexAuthRoutes from './codex-auth.routes.js';

const router = Router();

// Setup job monitoring UI (protected)
setupBullBoard(router);

router.use('/auth', authRoutes);
router.use('/generate', generateRoutes);
router.use('/posts', postsRoutes);
router.use('/platforms', platformsRoutes);
router.use('/settings', settingsRoutes);
router.use('/viral', viralRoutes);
router.use('/templates', templatesRoutes);
router.use('/styles', stylesRoutes);
router.use('/images', imagesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/trending', trendingRoutes);
router.use('/pillars', pillarsRoutes);
router.use('/stripe', stripeRoutes);
router.use('/admin', adminRoutes);
router.use('/workspaces', workspacesRoutes);
router.use('/agent', agentRoutes);
router.use('/autoblog', autoBlogRoutes);
router.use('/inbox', inboxRoutes);
router.use('/assist', assistRoutes);
router.use('/auth/chatgpt-pro', codexAuthRoutes);
import { outreachRoutes } from './outreach.routes.js';
import { liveRoutes } from './live.routes.js';
import { audioRoutes } from './audio.routes.js';
import { automationsRoutes } from './automations.routes.js';

router.use('/outreach', outreachRoutes);
router.use('/live', liveRoutes);
router.use('/audio', audioRoutes);
router.use('/automations', automationsRoutes);

// Health check
router.get('/health', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    const pool = getDb();
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  const queueHealth = await getQueueHealth();
  const overallStatus =
    dbStatus === 'ok' && queueHealth.redis === 'ok' && queueHealth.queue === 'ok'
      ? 'ok'
      : 'degraded';

  res.status(overallStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    database: dbStatus,
    redis: queueHealth.redis,
    queue: queueHealth.queue,
    queueDetails: queueHealth.details,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

export default router;
