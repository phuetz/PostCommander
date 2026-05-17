import { Worker, Job, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { processAgentWorkflow } from '../agent/workflow.js';

interface AgentJobData {
  commentId: string;
}

import { sharedRedisConnection } from '../../utils/redis.js';

const connection = sharedRedisConnection;

export const agentWorker = new Worker<AgentJobData>(
  'agent-workflow',
  async (job: Job<AgentJobData>) => {
    const { commentId } = job.data;
    logger.info(`Processing agent workflow for comment ${commentId}`);

    try {
      await processAgentWorkflow(commentId);
      logger.info(`Finished processing agent workflow for comment ${commentId}`);
    } catch (error: unknown) {
      logger.error({ error, commentId }, 'Failed to process agent workflow');
      throw error;
    }
  },
  {
    connection: connection as WorkerOptions['connection'],
  },
);

agentWorker.on('completed', (job) => {
  logger.info(`Agent job ${job.id} has completed!`);
});

agentWorker.on('failed', (job, err) => {
  logger.error(`Agent job ${job?.id} has failed with ${err.message}`);
});
