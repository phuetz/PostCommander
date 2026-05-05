import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { postQueue } from '../services/jobs/queue.js';
import { authMiddleware } from './auth.js';
import { requireAdmin } from './admin.js';
import { Router } from 'express';

export function setupBullBoard(router: Router) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/api/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(postQueue)],
    serverAdapter: serverAdapter,
  });

  router.use('/admin/queues', authMiddleware, requireAdmin, serverAdapter.getRouter());
}
