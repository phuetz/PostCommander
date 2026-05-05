import { describe, expect, it } from 'vitest';
import type express from 'express';
import {
  getHttpErrorMessage,
  getHttpErrorObject,
  getHttpLogLevel,
  getHttpSuccessMessage,
  isOperationalProbe,
} from './setup.js';

function mockReq(partial: Partial<express.Request>): express.Request {
  return partial as express.Request;
}

function mockRes(partial: Partial<express.Response>): express.Response {
  return partial as express.Response;
}

describe('HTTP logging middleware helpers', () => {
  it('identifies operational probes', () => {
    expect(isOperationalProbe(mockReq({ url: '/api/health' }))).toBe(true);
    expect(isOperationalProbe(mockReq({ url: '/api/live' }))).toBe(true);
    expect(isOperationalProbe(mockReq({ url: '/api/posts' }))).toBe(false);
  });

  it('silences healthy probes and warns on degraded readiness', () => {
    expect(getHttpLogLevel(mockReq({ url: '/api/health' }), mockRes({ statusCode: 200 }))).toBe(
      'silent',
    );
    expect(getHttpLogLevel(mockReq({ url: '/api/live' }), mockRes({ statusCode: 200 }))).toBe(
      'silent',
    );
    expect(getHttpLogLevel(mockReq({ url: '/api/health' }), mockRes({ statusCode: 503 }))).toBe(
      'warn',
    );
  });

  it('keeps standard request log levels for non-probe routes', () => {
    expect(getHttpLogLevel(mockReq({ url: '/api/posts' }), mockRes({ statusCode: 200 }))).toBe(
      'info',
    );
    expect(getHttpLogLevel(mockReq({ url: '/api/posts' }), mockRes({ statusCode: 404 }))).toBe(
      'warn',
    );
    expect(getHttpLogLevel(mockReq({ url: '/api/posts' }), mockRes({ statusCode: 503 }))).toBe(
      'error',
    );
  });

  it('returns dedicated probe messages and omits synthetic error stacks', () => {
    expect(
      getHttpSuccessMessage(
        mockReq({ url: '/api/health', readableAborted: false }),
        mockRes({ writableEnded: true }),
      ),
    ).toBe('readiness check passed');

    expect(
      getHttpErrorMessage(
        mockReq({ url: '/api/health' }),
        mockRes({ statusCode: 503 }),
        new Error('failed with status code 503'),
      ),
    ).toBe('readiness check degraded');

    expect(
      getHttpErrorObject(
        mockReq({ url: '/api/health' }),
        mockRes({ statusCode: 503 }),
        new Error('failed with status code 503'),
        {
          res: { statusCode: 503 },
          err: { stack: 'synthetic stack' },
          responseTime: 12,
        },
      ),
    ).toEqual({
      res: { statusCode: 503 },
      responseTime: 12,
      probe: 'health',
    });
  });
});
