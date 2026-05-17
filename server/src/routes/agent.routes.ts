import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  simulateCommentHandler,
  scrapeLeadHandler,
  ghostwriteCommentHandler,
  shadowProfileHandler,
  emergencyStopHandler,
} from '../controllers/agent.controller.js';

const router = Router();

// Test endpoint to simulate incoming interaction and trigger the autonomous agent
router.post('/simulate-comment', authMiddleware, simulateCommentHandler);

// Endpoint for Chrome Extension to push scraped leads
// Note: In production, we should probably authenticate the extension differently, but for MVP we use requireAuth
router.post('/scrape-lead', authMiddleware, scrapeLeadHandler);

// Endpoint for Chrome Extension to auto-complete comments
router.post('/ghostwrite-comment', authMiddleware, ghostwriteCommentHandler);

// Endpoint for Chrome Extension shadow profiling
router.post('/shadow-profile', authMiddleware, shadowProfileHandler);

// Endpoint for Chrome Extension to trigger an emergency stop (Anti-Bot detection)
router.post('/emergency-stop', authMiddleware, emergencyStopHandler);

export default router;
