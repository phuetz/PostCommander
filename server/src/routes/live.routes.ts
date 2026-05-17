import { Router } from 'express';
import { liveActivity } from '../services/live-activity.js';

export const liveRoutes = Router();

liveRoutes.get('/stream', (req, res) => {
  const moduleFilter = req.query.module as string | undefined;
  liveActivity.subscribe(req, res, moduleFilter);
});
