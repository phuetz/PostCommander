import pino, { type Logger } from 'pino';

export type { Logger };

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Redaction paths follow Pino's syntax (lodash-style with wildcards). They cover:
 *   - request bodies that may carry credentials (login, register, reset, account delete)
 *   - HTTP headers carrying session material (cookies, bearer tokens)
 *   - any nested field literally named accessToken / refreshToken / password — covers
 *     OAuth flows, error stacktraces with serialized request payloads, etc.
 *
 * Keep the list narrow but defensive: a missing redact = a real PII incident.
 */
const REDACT_PATHS = [
  'req.body.password',
  'req.body.passwordHash',
  'req.body.currentPassword',
  'req.body.confirmation',
  'req.body.token',
  'req.body.code',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'headers.authorization',
  'headers.cookie',
  '*.password',
  '*.passwordHash',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.api_key',
  '*.client_secret',
  '*.clientSecret',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
