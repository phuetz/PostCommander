import { Response } from 'express';
import { sharedRedisConnection } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export interface LiveActivityEvent {
  id: string;
  module: 'outreach' | 'autoblog' | 'system';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class LiveActivityManager {
  private clients: Map<string, { res: Response; moduleFilter?: string }> = new Map();
  private redisClient = sharedRedisConnection;
  private readonly MAX_HISTORY = 100;
  private readonly HISTORY_KEY_PREFIX = 'postcommander:live:history:';

  /**
   * Subscribe a new client to the SSE stream.
   */
  subscribe(req: any, res: Response, moduleFilter?: string) {
    const clientId = randomUUID();
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if applicable

    this.clients.set(clientId, { res, moduleFilter });
    logger.info(`[SSE] Client connected: ${clientId} (Filter: ${moduleFilter || 'none'})`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      this.clients.delete(clientId);
      logger.info(`[SSE] Client disconnected: ${clientId}`);
    });

    // Send recent history immediately
    this.sendHistory(clientId, res, moduleFilter).catch(err => {
      logger.error({ err }, '[SSE] Failed to send history');
    });
  }

  /**
   * Broadcast an event to all connected clients and save to Redis.
   */
  async broadcast(
    module: LiveActivityEvent['module'],
    message: string,
    level: LiveActivityEvent['level'] = 'info',
    metadata?: Record<string, any>
  ) {
    const event: LiveActivityEvent = {
      id: randomUUID(),
      module,
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const eventString = JSON.stringify(event);

    // 1. Save to Redis History
    try {
      const key = `${this.HISTORY_KEY_PREFIX}${module}`;
      const pipeline = this.redisClient.pipeline();
      pipeline.lpush(key, eventString);
      pipeline.ltrim(key, 0, this.MAX_HISTORY - 1);
      pipeline.expire(key, 60 * 60 * 24 * 7); // 7 days expiration
      await pipeline.exec();
    } catch (err) {
      logger.error({ err }, '[SSE] Failed to save event to Redis');
    }

    // 2. Broadcast to connected SSE clients
    const payload = `data: ${eventString}\n\n`;
    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (!client.moduleFilter || client.moduleFilter === module) {
        client.res.write(payload);
        sentCount++;
      }
    }

    logger.debug(`[SSE] Broadcasted ${module} event to ${sentCount} clients`);
  }

  /**
   * Fetch recent history for a specific module and send it.
   */
  private async sendHistory(clientId: string, res: Response, moduleFilter?: string) {
    if (!moduleFilter) return;

    try {
      const key = `${this.HISTORY_KEY_PREFIX}${moduleFilter}`;
      const historyStrings = await this.redisClient.lrange(key, 0, this.MAX_HISTORY - 1);
      
      if (historyStrings.length > 0) {
        // Events come out newest-first (LPUSH), we want to send them oldest-first
        const events = historyStrings.reverse();
        for (const evt of events) {
          res.write(`data: ${evt}\n\n`);
        }
        logger.info(`[SSE] Sent ${events.length} historical events to client ${clientId}`);
      }
    } catch (err) {
      logger.error({ err }, '[SSE] Error fetching history from Redis');
    }
  }
}

export const liveActivity = new LiveActivityManager();
