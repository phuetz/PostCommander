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

router.get('/live', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Health check
router.get('/health', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
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
