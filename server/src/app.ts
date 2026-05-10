import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error-handler.js';
import { setupMiddlewares } from './middleware/setup.js';
import apiRoutes from './routes/index.js';
import { stripeWebhookHandler } from './controllers/stripe.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): express.Application {
  const app = express();

  // ── Setup Security, CORS, Logging, and Rate Limiting ────────
  setupMiddlewares(app);

  // ── Cookie parsing ──────────────────────────────────────────
  app.use(cookieParser());

  // ── Stripe webhook (needs raw body BEFORE json parsing) ────
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

  // ── Body parsing ────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── API routes ──────────────────────────────────────────────
  app.use('/api', apiRoutes);

  // ── Serve static client files (Production only) ─────────────
  if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '..', '..', '..', 'client', 'dist');
    app.use(express.static(clientDistPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // ── Error handler (must be last) ───────────────────────────
  app.use(errorHandler);

  return app;
}
