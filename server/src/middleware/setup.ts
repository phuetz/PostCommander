import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

type HttpLogLevel = 'silent' | 'info' | 'warn' | 'error';

export function isOperationalProbe(req: express.Request): boolean {
  return req.url.startsWith('/api/health') || req.url.startsWith('/api/live');
}

export function getHttpLogLevel(
  req: express.Request,
  res: express.Response,
  err?: Error,
): HttpLogLevel {
  if (isOperationalProbe(req)) {
    return res.statusCode >= 500 ? 'warn' : 'silent';
  }

  if (err || res.statusCode >= 500) {
    return 'error';
  }

  if (res.statusCode >= 400) {
    return 'warn';
  }

  return 'info';
}

export function getHttpSuccessMessage(
  req: express.Request,
  res: express.Response,
): string {
  if (req.url.startsWith('/api/live')) {
    return 'liveness check passed';
  }

  if (req.url.startsWith('/api/health')) {
    return 'readiness check passed';
  }

  return !req.readableAborted && res.writableEnded
    ? 'request completed'
    : 'request aborted';
}

export function getHttpErrorMessage(
  req: express.Request,
  _res: express.Response,
  _err: Error,
): string {
  if (req.url.startsWith('/api/health')) {
    return 'readiness check degraded';
  }

  if (req.url.startsWith('/api/live')) {
    return 'liveness check failed';
  }

  return 'request errored';
}

export function getHttpErrorObject(
  req: express.Request,
  _res: express.Response,
  _err: Error,
  value: Record<string, unknown>,
): Record<string, unknown> {
  if (!isOperationalProbe(req)) {
    return value;
  }

  const { res: serializedResponse, responseTime } = value;
  return {
    res: serializedResponse,
    responseTime,
    probe: req.url.startsWith('/api/live') ? 'live' : 'health',
  };
}

export function setupMiddlewares(app: express.Application) {
  // ── Logging ─────────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      // Honor an upstream X-Request-Id (e.g. from a load balancer) when present;
      // generate a UUID otherwise. The id is exposed back on the response so a
      // browser/curl run can correlate with the server log line.
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const reqId =
          (typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 200)
            ? incoming
            : randomUUID();
        res.setHeader('X-Request-Id', reqId);
        return reqId;
      },
      customLogLevel: getHttpLogLevel,
      customSuccessMessage: getHttpSuccessMessage,
      customErrorMessage: getHttpErrorMessage,
      customErrorObject: getHttpErrorObject,
    }),
  );

  // ── Compression ─────────────────────────────────────────────
  app.use(compression());

  // ── Security ────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Vite builds emit only external scripts; no inline <script> blocks
          // are needed. styleSrc keeps 'unsafe-inline' because some component
          // libraries inject <style> tags at runtime.
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.stripe.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: config.CLIENT_URL || '*',
      credentials: true,
    }),
  );

  // ── Rate limiting ───────────────────────────────────────────
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute for normal API usage
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
  });
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // 15 requests per 15 minutes for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many login attempts. Please try again later.' },
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);

  // Note: Body parsers are added after Stripe webhook route in app.ts
}
