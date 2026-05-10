import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { simulateCommentHandler, scrapeLeadHandler, ghostwriteCommentHandler, shadowProfileHandler } from '../controllers/agent.controller.js';

const router = Router();

// Test endpoint to simulate incoming interaction and trigger the autonomous agent
router.post('/simulate-comment', requireAuth, simulateCommentHandler);

// Endpoint for Chrome Extension to push scraped leads
// Note: In production, we should probably authenticate the extension differently, but for MVP we use requireAuth
router.post('/scrape-lead', requireAuth, scrapeLeadHandler);

// Endpoint for Chrome Extension to auto-complete comments
router.post('/ghostwrite-comment', requireAuth, ghostwriteCommentHandler);

// Endpoint for Chrome Extension shadow profiling
router.post('/shadow-profile', requireAuth, shadowProfileHandler);

export default router;
