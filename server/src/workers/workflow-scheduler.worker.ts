import { Worker, type Job } from 'bullmq';
import { getDrizzle } from '../db/connection.js';
import { flowAutomations } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { sharedRedisConnection } from '../utils/redis.js';
import { scraperFlowQueue, workflowSchedulerQueue } from '../services/jobs/queue.js';
import { attachWorkerObservability } from '../utils/worker-helpers.js';

const connection = sharedRedisConnection;

export interface WorkflowSchedulerStats {
  checked: number;
  triggered: number;
  skipped: number;
  errors: number;
}

/**
 * Main scheduler cycle: scans all active flow automations, detects if they have
 * a time-based (cron) or feed-based (rss) trigger due for execution, and enqueues
 * an execution job if the elapsed time exceeds the configured interval.
 */
export async function runWorkflowSchedulerCycle(): Promise<WorkflowSchedulerStats> {
  const db = getDrizzle();
  logger.info('[WorkflowScheduler] Scanning active automations...');

  const activeFlows = await db
    .select()
    .from(flowAutomations)
    .where(eq(flowAutomations.status, 'active'));

  logger.info(`[WorkflowScheduler] Found ${activeFlows.length} active automations`);

  const stats: WorkflowSchedulerStats = {
    checked: activeFlows.length,
    triggered: 0,
    skipped: 0,
    errors: 0,
  };

  const now = new Date();

  for (const flow of activeFlows) {
    try {
      const flowData = JSON.parse(flow.flowData);
      const nodes = flowData.nodes || [];

      // Find any node that acts as a periodic schedule trigger (cron or rss)
      const scheduleNode = nodes.find(
        (node: any) =>
          node.id?.includes('cron') ||
          node.id?.includes('rss') ||
          (node.data?.type === 'trigger' &&
            (node.data?.iconName === 'Clock' || node.data?.iconName === 'Rss'))
      );

      if (!scheduleNode) {
        logger.debug(`[WorkflowScheduler] Automation ${flow.id} has no schedule trigger - skipping.`);
        stats.skipped++;
        continue;
      }

      // Read interval from node data, default to 60 minutes
      let interval = 60;
      if (scheduleNode.data && typeof scheduleNode.data.interval === 'number') {
        interval = scheduleNode.data.interval;
      } else if (scheduleNode.data && typeof scheduleNode.data.interval === 'string') {
        const parsed = parseInt(scheduleNode.data.interval, 10);
        if (!isNaN(parsed)) {
          interval = parsed;
        }
      }

      // Safety check to prevent intervals < 1 minute (or 0)
      if (interval < 1) {
        interval = 1;
      }

      const lastRun = flow.lastRunAt ? new Date(flow.lastRunAt) : new Date(flow.createdAt);
      const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);

      if (diffMinutes >= interval) {
        logger.info(
          `[WorkflowScheduler] Triggering automation ${flow.id} (${flow.name}). Interval: ${interval}m, elapsed: ${Math.round(diffMinutes)}m`
        );

        // Enqueue execution in scraper-flow queue
        await scraperFlowQueue.add(
          'execute-flow',
          {
            automationId: flow.id,
            flowData,
            userId: flow.userId,
            workspaceId: flow.workspaceId,
          },
          {
            jobId: `execute-flow:scheduler:${flow.id}:${now.getTime()}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );

        // Update lastRunAt to prevent double-execution
        await db
          .update(flowAutomations)
          .set({ lastRunAt: now.toISOString(), updatedAt: now.toISOString() })
          .where(eq(flowAutomations.id, flow.id));

        stats.triggered++;
      } else {
        logger.debug(
          `[WorkflowScheduler] Automation ${flow.id} (${flow.name}) is not due. Interval: ${interval}m, elapsed: ${Math.round(diffMinutes)}m`
        );
        stats.skipped++;
      }
    } catch (err: any) {
      logger.error({ err }, `[WorkflowScheduler] Error checking automation ${flow.id}`);
      stats.errors++;
    }
  }

  logger.info(stats, '[WorkflowScheduler] Scan cycle completed');
  return stats;
}

export const workflowSchedulerWorker = new Worker(
  'workflow-scheduler',
  async (_job: Job) => {
    await runWorkflowSchedulerCycle();
  },
  {
    connection: connection as any,
    concurrency: 1,
  }
);

attachWorkerObservability(workflowSchedulerWorker, 'workflow-scheduler');

export async function startWorkflowScheduler() {
  logger.info('[WorkflowScheduler] Initializing repeatable schedule scans...');

  // Clean up any duplicate repeatable jobs
  const repeatableJobs = await workflowSchedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await workflowSchedulerQueue.removeRepeatableByKey(job.key);
  }

  // Add the scheduler scan job to run every minute
  await workflowSchedulerQueue.add(
    'workflow-scan-tick',
    {},
    {
      jobId: 'workflow-scheduler-tick-recurring',
      repeat: { pattern: '* * * * *' },
    }
  );

  logger.info('[WorkflowScheduler] Repeatable scan tick registered (every 1 minute)');
}
