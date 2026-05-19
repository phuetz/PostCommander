import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from './config/env.js';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    // @ts-expect-error - dsn is valid but type definitions might be mismatched
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}
import { initDb, closeDb } from './db/connection.js';
import { createApp } from './app.js';
import { seedViralPosts } from './services/viral/index.js';
import { seedTemplates } from './services/templates/index.js';
import { logger } from './utils/logger.js';
import './services/jobs/worker.js';
import './services/jobs/agent.worker.js';
import './workers/autoblog.worker.js';
import './workers/outreach.worker.js';
import { startAnalyticsWorker } from './workers/analytics.worker.js';
import { startAutoBlogWorker } from './workers/autoblog.worker.js';
import { startOutreachWorker } from './workers/outreach.worker.js';
import { startPublishingWorker } from './workers/publishing.worker.js';

async function main(): Promise<void> {
  // Initialize the database
  logger.info('Initializing database...');
  initDb();
  
  const { runMigrations } = await import('./db/migrate.js');
  await runMigrations();

  // Seed reference data
  logger.info('Seeding reference data...');
  seedViralPosts();
  seedTemplates();

  // Start scheduled workers
  logger.info('Starting scheduled workers...');
  startAnalyticsWorker();
  startAutoBlogWorker();
  startOutreachWorker();
  startPublishingWorker();

  // Create the Express app
  const app = createApp();

  // Start listening
  const server = app.listen(config.PORT, () => {
    logger.info(`PostCommander server running on port ${config.PORT}`);
    logger.info(`  Environment: ${config.NODE_ENV}`);
    logger.info(`  API:         http://localhost:${config.PORT}/api`);
    logger.info(`  Live:        http://localhost:${config.PORT}/api/live`);
    logger.info(`  Health:      http://localhost:${config.PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      closeDb();
      logger.info('Server shut down.');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error during startup');
  process.exit(1);
});
