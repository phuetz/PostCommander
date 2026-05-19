import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import { flowAutomations } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { scraperFlowQueue } from '../services/jobs/queue.js';
import { logger } from '../utils/logger.js';
import { runWorkflowBuilderAgent } from '../services/agent/workflow-builder.js';

export const automationsRoutes = Router();

// Unauthenticated Webhook Endpoint to trigger an automation
automationsRoutes.post('/webhooks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDrizzle();

    const [automation] = await db
      .select()
      .from(flowAutomations)
      .where(eq(flowAutomations.id, id));

    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Add job to scraperFlowQueue
    const job = await scraperFlowQueue.add(
      'execute-flow',
      {
        automationId: automation.id,
        flowData: JSON.parse(automation.flowData),
        userId: automation.userId,
        workspaceId: automation.workspaceId,
        webhookPayload: req.body,
      },
      {
        jobId: `execute-flow:webhook:${automation.id}:${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    // Update last run time
    await db
      .update(flowAutomations)
      .set({ lastRunAt: new Date().toISOString() })
      .where(eq(flowAutomations.id, id));

    logger.info(`Webhook triggered automation flow ${automation.id}`);

    res.json({ message: 'Automation triggered by webhook successfully', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

automationsRoutes.use(authMiddleware);

// .strict() rejects unknown keys so a payload containing { isAdmin: true } or
// { userId: "<someone-else>" } can't slip through into the DB row.
const automationUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    status: z.enum(['draft', 'active']).default('draft'),
    flowData: z.string().min(1).max(200_000), // JSON string — capped to avoid 100MB rows
  })
  .strict();

function requireWorkspace(req: Request, res: Response): string | null {
  if (!req.workspaceId) {
    res.status(400).json({ error: 'Missing X-Workspace-Id header' });
    return null;
  }
  return req.workspaceId;
}

// Get all automations for user's workspace
automationsRoutes.get('/', async (req, res, next) => {
  try {
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const db = getDrizzle();
    const automations = await db
      .select()
      .from(flowAutomations)
      .where(
        and(
          eq(flowAutomations.userId, req.user!.id),
          eq(flowAutomations.workspaceId, workspaceId),
        ),
      );

    res.json({ data: automations });
  } catch (error) {
    next(error);
  }
});

// Create or update an automation
automationsRoutes.post('/', validate(automationUpsertSchema), async (req, res, next) => {
  try {
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const { name, status, flowData, id } = req.body as z.infer<typeof automationUpsertSchema>;
    const db = getDrizzle();

    if (id) {
      const [updated] = await db
        .update(flowAutomations)
        .set({ name, status, flowData, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(flowAutomations.id, id),
            eq(flowAutomations.userId, req.user!.id),
            eq(flowAutomations.workspaceId, workspaceId),
          ),
        )
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Automation not found' });
      }
      return res.json({ data: updated });
    }

    const [created] = await db
      .insert(flowAutomations)
      .values({
        id: randomUUID(),
        userId: req.user!.id,
        workspaceId,
        name,
        status,
        flowData,
      })
      .returning();

    return res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

// Trigger an automation execution manually (Test Run)
automationsRoutes.post('/:id/trigger', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDrizzle();

    const [automation] = await db
      .select()
      .from(flowAutomations)
      .where(
        and(
          eq(flowAutomations.id, id),
          eq(flowAutomations.userId, req.user!.id),
          eq(flowAutomations.workspaceId, req.workspaceId!)
        )
      );

    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Add job to scraperFlowQueue
    const job = await scraperFlowQueue.add(
      'execute-flow',
      {
        automationId: automation.id,
        flowData: JSON.parse(automation.flowData),
        userId: req.user!.id,
        workspaceId: req.workspaceId!,
      },
      {
        // Deterministic jobId so repeat "trigger" calls don't pile up; the
        // timestamp suffix scopes it per manual run, so a second run after
        // the first completes is allowed.
        jobId: `execute-flow:${automation.id}:${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    // Update last run time
    await db
      .update(flowAutomations)
      .set({ lastRunAt: new Date().toISOString() })
      .where(eq(flowAutomations.id, id));

    logger.info(`Triggered automation flow ${automation.id}`);

    res.json({ message: 'Automation triggered successfully', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

// Get the status and result of an automation run/job
automationsRoutes.get('/jobs/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await scraperFlowQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({
      id: job.id,
      state,
      progress: job.progress,
      result,
      failedReason,
    });
  } catch (error) {
    next(error);
  }
});

// AI Agent workflow builder endpoint
automationsRoutes.post('/agent/build', async (req, res, next) => {
  try {
    const { messages, currentState } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }
    const nodes = currentState?.nodes || [];
    const edges = currentState?.edges || [];

    const result = await runWorkflowBuilderAgent(
      req.user!.id,
      messages,
      { nodes, edges }
    );

    res.json({
      text: result.text,
      workflow: result.nextState,
      steps: result.steps,
    });
  } catch (error) {
    next(error);
  }
});


