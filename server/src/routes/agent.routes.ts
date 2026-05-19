import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  simulateCommentHandler,
  scrapeLeadHandler,
  ghostwriteCommentHandler,
  shadowProfileHandler,
  emergencyStopHandler,
} from '../controllers/agent.controller.js';
import {
  agentSimulateCommentSchema,
  agentScrapeLeadSchema,
  agentGhostwriteCommentSchema,
  agentShadowProfileSchema,
  agentEmergencyStopSchema,
} from '../schemas/routes.js';

const router = Router();

router.post(
  '/simulate-comment',
  authMiddleware,
  validate(agentSimulateCommentSchema),
  simulateCommentHandler,
);

// Endpoint for Chrome Extension to push scraped leads.
// Note: extension auth is still cookie-based; in prod we'd consider an extension
// API key with rate limits scoped per-installation.
router.post('/scrape-lead', authMiddleware, validate(agentScrapeLeadSchema), scrapeLeadHandler);

router.post(
  '/ghostwrite-comment',
  authMiddleware,
  validate(agentGhostwriteCommentSchema),
  ghostwriteCommentHandler,
);

router.post(
  '/shadow-profile',
  authMiddleware,
  validate(agentShadowProfileSchema),
  shadowProfileHandler,
);

router.post(
  '/emergency-stop',
  authMiddleware,
  validate(agentEmergencyStopSchema),
  emergencyStopHandler,
);

export default router;
