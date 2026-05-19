import type { JobsOptions, Queue, Worker, Job } from 'bullmq';
import type { Request } from 'express';
import * as Sentry from '@sentry/node';
import { logger, type Logger } from './logger.js';

/**
 * Standard observability wiring for every BullMQ Worker:
 *   - structured pino log on failed jobs (with jobId + attempt count + queue name)
 *   - Sentry.captureException so on-call gets paged for repeated failures
 *
 * Call once per Worker instance: `attachWorkerObservability(myWorker, 'queue-name')`.
 *
 * The DLQ pattern is approximated by Sentry alerts: a failed job after all
 * `attempts` (defined in queue.defaultJobOptions) reports to Sentry with the
 * full job context; ops can replay manually via bull-board.
 */
export function attachWorkerObservability(worker: Worker, queueName: string): void {
  worker.on('failed', (job, err) => {
    const attemptsMade = job?.attemptsMade ?? 0;
    const attemptsMax = (job?.opts?.attempts ?? 1) as number;
    const isFinalFailure = attemptsMade >= attemptsMax;

    logger.error(
      {
        err,
        queue: queueName,
        jobId: job?.id,
        jobName: job?.name,
        attempt: attemptsMade,
        maxAttempts: attemptsMax,
        isFinalFailure,
      },
      `[${queueName}] Job failed${isFinalFailure ? ' (final)' : ' (will retry)'}`,
    );

    // Only page Sentry on the final failure — otherwise every transient retry
    // would create noise. Sentry alerts are configured per-project externally.
    if (isFinalFailure && process.env.SENTRY_DSN) {
      Sentry.captureException(err, {
        tags: {
          queue: queueName,
          jobName: job?.name ?? 'unknown',
        },
        extra: {
          jobId: job?.id,
          attemptsMade,
          maxAttempts: attemptsMax,
          jobData: job?.data,
        },
      });
    }
  });

  worker.on('error', (err) => {
    // Worker-level errors (connection lost, etc.) — always page.
    logger.error({ err, queue: queueName }, `[${queueName}] Worker error`);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err, { tags: { queue: queueName, kind: 'worker-error' } });
    }
  });
}

/**
 * Race a promise against a timeout. Resolves with the inner promise if it
 * settles in time, otherwise rejects with a TimeoutError. Used to bound calls
 * to flaky external libs (Stagehand .act, Browserbase nav, etc.) — without it
 * a hung browser session blocks the worker forever.
 */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'operation',
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

/**
 * Conventional shape: every job's data carries an optional `__requestId` so the
 * worker can correlate its logs / Sentry events back to the HTTP request that
 * enqueued the job. Use `enqueueWithContext(queue, req, name, data, opts)` from
 * routes to wire it up.
 */
export interface JobContext {
  __requestId?: string;
}

export async function enqueueWithContext<T extends object>(
  queue: Queue,
  req: Request | undefined,
  name: string,
  data: T,
  opts?: JobsOptions,
): Promise<void> {
  const requestId = req?.id ? String(req.id) : undefined;
  await queue.add(name, { ...data, __requestId: requestId } as T & JobContext, opts);
}

/**
 * Return a pino child logger bound to the job's correlation IDs. Use at the
 * top of every worker processor:
 *   const log = jobLogger(job, 'analytics-sync');
 *   log.info({ ... }, 'message');
 */
export function jobLogger(job: Job, queueName: string): Logger {
  const requestId =
    job.data && typeof job.data === 'object' && '__requestId' in job.data
      ? (job.data as JobContext).__requestId
      : undefined;
  return logger.child({
    queue: queueName,
    jobId: job.id,
    jobName: job.name,
    ...(requestId ? { requestId } : {}),
  });
}
