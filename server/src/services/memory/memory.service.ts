import { MemoryClient } from 'mem0ai';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

class MemoryService {
  private client: MemoryClient | null = null;
  private isEnabled = false;

  constructor() {
    // If MEM0_HOST is provided, we run locally (Docker self-hosted)
    if (config.MEM0_HOST) {
      // In local mode, we might still need a dummy API key for the SDK to initialize
      this.client = new MemoryClient({ apiKey: config.MEM0_API_KEY || 'local', host: config.MEM0_HOST });
      this.isEnabled = true;
      logger.info(`[MemoryService] Mem0 client initialized locally pointing to ${config.MEM0_HOST}`);
    } else if (config.MEM0_API_KEY) {
      this.client = new MemoryClient({ apiKey: config.MEM0_API_KEY });
      this.isEnabled = true;
      logger.info('[MemoryService] Mem0 client initialized in Cloud mode');
    } else {
      logger.warn('[MemoryService] Neither MEM0_API_KEY nor MEM0_HOST found. Agent memory is disabled.');
    }
  }

  /**
   * Memorizes an OSINT dossier, CV, or conversation context for a specific entity.
   */
  async memorize(entityId: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.isEnabled || !this.client) return;

    try {
      await this.client.add(
        [{ role: 'user', content }],
        { user_id: entityId, metadata }
      );
      logger.info({ entityId }, '[MemoryService] Context successfully memorized');
    } catch (error) {
      logger.error({ err: error, entityId }, '[MemoryService] Failed to memorize context');
    }
  }

  /**
   * Recalls the most relevant context from memory for a specific entity given a query.
   */
  async recall(entityId: string, query: string, limit: number = 3): Promise<string> {
    if (!this.isEnabled || !this.client) return 'No context available.';

    try {
      const searchOpts: any = { user_id: entityId, limit };
      const results = await this.client.search(query, searchOpts);
      if (!results || (Array.isArray(results) && results.length === 0) || ((results as any).results && (results as any).results.length === 0)) {
        return 'No context available.';
      }

      // Mem0 returns an array of memory objects with a 'memory' string field
      const resultsArray = Array.isArray(results) ? results : (results as any).results || [];
      const memories = resultsArray.map((r: any) => `- ${r.memory}`).join('\n');
      logger.info({ entityId, limit }, '[MemoryService] Successfully recalled context');
      return memories;
    } catch (error) {
      logger.error({ err: error, entityId }, '[MemoryService] Failed to recall context');
      return 'No context available due to error.';
    }
  }
}

export const memoryService = new MemoryService();
