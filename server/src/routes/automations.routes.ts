import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import {
  flowAutomations,
  chatSessions,
  chatMessages,
  automationRuns,
} from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { scraperFlowQueue } from '../services/jobs/queue.js';
import { logger } from '../utils/logger.js';
import {
  runWorkflowBuilderAgent,
  runWorkflowBuilderAgentStream,
  type AgentStreamChunk,
  type WorkflowMutation,
} from '../services/agent/workflow-builder.js';

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

const automationUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    status: z.enum(['draft', 'active']).default('draft'),
    flowData: z.string().min(1).max(200_000),
  })
  .strict();

function requireWorkspace(req: Request, res: Response): string | null {
  if (!req.workspaceId) {
    res.status(400).json({ error: 'Missing X-Workspace-Id header' });
    return null;
  }
  return req.workspaceId;
}

async function ownsAutomation(automationId: string, userId: string, workspaceId: string) {
  const db = getDrizzle();
  const [row] = await db
    .select()
    .from(flowAutomations)
    .where(
      and(
        eq(flowAutomations.id, automationId),
        eq(flowAutomations.userId, userId),
        eq(flowAutomations.workspaceId, workspaceId),
      ),
    );
  return row ?? null;
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
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const automation = await ownsAutomation(id, req.user!.id, workspaceId);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    const db = getDrizzle();
    const job = await scraperFlowQueue.add(
      'execute-flow',
      {
        automationId: automation.id,
        flowData: JSON.parse(automation.flowData),
        userId: req.user!.id,
        workspaceId,
      },
      {
        jobId: `execute-flow:${automation.id}:${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

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

// AI Agent workflow builder endpoint (LEGACY non-streaming — kept while front migrates)
automationsRoutes.post('/agent/build', async (req, res, next) => {
  try {
    const { messages, currentState } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }
    const nodes = currentState?.nodes || [];
    const edges = currentState?.edges || [];

    const result = await runWorkflowBuilderAgent(req.user!.id, messages, { nodes, edges });

    res.json({
      text: result.text,
      workflow: result.nextState,
      steps: result.steps,
    });
  } catch (error) {
    next(error);
  }
});

// AI Agent — Server-Sent Events streaming variant.
// Body: { messages, currentState, sessionId? }
// Persists user message at start, assistant message + tool calls at completion.
automationsRoutes.post('/agent/build/stream', async (req, res, next) => {
  try {
    const { messages, currentState, sessionId } = req.body as {
      messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
      currentState?: { nodes?: any[]; edges?: any[] };
      sessionId?: string;
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    const nodes = currentState?.nodes || [];
    const edges = currentState?.edges || [];
    const db = getDrizzle();

    // Persist the user's incoming message right away so it survives crashes.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (sessionId && lastUser) {
      // Confirm session ownership before writing
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, req.user!.id)));
      if (!session) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
      await db.insert(chatMessages).values({
        id: randomUUID(),
        sessionId,
        role: 'user',
        content: lastUser.content,
        toolCalls: null,
      });
      await db
        .update(chatSessions)
        .set({ lastMessageAt: new Date().toISOString() })
        .where(eq(chatSessions.id, sessionId));
    }

    // SSE headers (mirrors generate.controller.ts pattern).
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // 15s keepalive (idle agent calls can exceed proxy timeouts)
    const keepAlive = setInterval(() => res.write(': keepalive\n\n'), 15000);
    let aborted = false;
    req.on('close', () => {
      aborted = true;
      clearInterval(keepAlive);
    });

    const collectedToolCalls: Array<{ name: string; args: any; mutation?: WorkflowMutation }> = [];
    let assistantText = '';

    try {
      await runWorkflowBuilderAgentStream(
        req.user!.id,
        messages,
        { nodes, edges },
        (chunk: AgentStreamChunk) => {
          if (aborted) return;
          switch (chunk.type) {
            case 'text-delta':
              assistantText += chunk.delta;
              sendEvent('text-delta', { delta: chunk.delta });
              break;
            case 'tool-call':
              collectedToolCalls.push({ name: chunk.name, args: chunk.args });
              sendEvent('tool-call', {
                toolCallId: chunk.toolCallId,
                name: chunk.name,
                args: chunk.args,
              });
              break;
            case 'tool-result': {
              const idx = collectedToolCalls.length - 1;
              if (idx >= 0 && chunk.mutation) {
                collectedToolCalls[idx].mutation = chunk.mutation;
              }
              sendEvent('tool-result', {
                toolCallId: chunk.toolCallId,
                result: chunk.result,
                mutation: chunk.mutation ?? null,
              });
              break;
            }
            case 'step-finish':
              sendEvent('step-finish', {});
              break;
            case 'done':
              sendEvent('done', {
                finalState: chunk.finalState,
                fullText: chunk.fullText,
              });
              break;
            case 'error':
              sendEvent('error', { error: chunk.error });
              break;
          }
        },
      );

      // Persist assistant message + tool calls
      if (sessionId && !aborted) {
        await db.insert(chatMessages).values({
          id: randomUUID(),
          sessionId,
          role: 'assistant',
          content: assistantText,
          toolCalls: collectedToolCalls.length > 0 ? (collectedToolCalls as any) : null,
        });
        await db
          .update(chatSessions)
          .set({ lastMessageAt: new Date().toISOString() })
          .where(eq(chatSessions.id, sessionId));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[agent-stream] route error: ${message}`);
      if (!aborted) sendEvent('error', { error: message });
    } finally {
      clearInterval(keepAlive);
      if (!aborted) res.end();
    }
  } catch (error) {
    next(error);
  }
});

// ----- Chat sessions CRUD -----

automationsRoutes.get('/:automationId/sessions', async (req, res, next) => {
  try {
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const automation = await ownsAutomation(req.params.automationId, req.user!.id, workspaceId);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    const db = getDrizzle();
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.automationId, automation.id))
      .orderBy(desc(chatSessions.lastMessageAt), desc(chatSessions.createdAt));

    res.json({ data: sessions });
  } catch (error) {
    next(error);
  }
});

automationsRoutes.post('/:automationId/sessions', async (req, res, next) => {
  try {
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const automation = await ownsAutomation(req.params.automationId, req.user!.id, workspaceId);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    const title = typeof req.body?.title === 'string' && req.body.title.trim()
      ? req.body.title.trim()
      : `Conversation ${new Date().toLocaleString('fr-FR')}`;

    const db = getDrizzle();
    const [created] = await db
      .insert(chatSessions)
      .values({
        id: randomUUID(),
        automationId: automation.id,
        userId: req.user!.id,
        workspaceId,
        title,
      })
      .returning();

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

automationsRoutes.get('/sessions/:id/messages', async (req, res, next) => {
  try {
    const db = getDrizzle();
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, req.params.id), eq(chatSessions.userId, req.user!.id)));
    if (!session) return res.status(404).json({ error: 'Chat session not found' });

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.id))
      .orderBy(chatMessages.createdAt);

    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
});

automationsRoutes.delete('/sessions/:id', async (req, res, next) => {
  try {
    const db = getDrizzle();
    const [deleted] = await db
      .delete(chatSessions)
      .where(and(eq(chatSessions.id, req.params.id), eq(chatSessions.userId, req.user!.id)))
      .returning();
    if (!deleted) return res.status(404).json({ error: 'Chat session not found' });
    res.json({ data: deleted });
  } catch (error) {
    next(error);
  }
});

// ----- Runs history -----

automationsRoutes.get('/:id/runs', async (req, res, next) => {
  try {
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const automation = await ownsAutomation(req.params.id, req.user!.id, workspaceId);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);

    const db = getDrizzle();
    const runs = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.automationId, automation.id))
      .orderBy(desc(automationRuns.startedAt))
      .limit(limit);

    res.json({ data: runs });
  } catch (error) {
    next(error);
  }
});

// ----- Test a single node with mock context -----
// Sub-job approach (option b in the plan): builds a 2-node mini-flow [mockTrigger, target]
// and enqueues it. The frontend polls /jobs/:jobId for the result.

automationsRoutes.post('/:id/nodes/:nodeId/test', async (req, res, next) => {
  try {
    const workspaceId = requireWorkspace(req, res);
    if (!workspaceId) return;

    const automation = await ownsAutomation(req.params.id, req.user!.id, workspaceId);
    if (!automation) return res.status(404).json({ error: 'Automation not found' });

    let flow: { nodes?: any[]; edges?: any[] };
    try {
      flow = JSON.parse(automation.flowData);
    } catch {
      return res.status(400).json({ error: 'Automation flowData is malformed' });
    }

    const target = flow.nodes?.find((n) => n.id === req.params.nodeId);
    if (!target) return res.status(404).json({ error: 'Node not found in this automation' });

    // Build a minimal flow: synthetic webhook trigger → target node.
    // If the target IS a trigger, we just run the trigger node alone.
    const mockTriggerId = `test-trigger_${Date.now()}`;
    const isTargetTrigger = target.data?.type === 'trigger';
    const miniFlow = isTargetTrigger
      ? { nodes: [target], edges: [] }
      : {
          nodes: [
            {
              id: mockTriggerId,
              type: 'customNode',
              position: { x: 0, y: 0 },
              data: { label: 'Test Trigger', type: 'trigger', iconName: 'Zap' },
            },
            target,
          ],
          edges: [{ id: 'e-test', source: mockTriggerId, target: target.id }],
        };

    const job = await scraperFlowQueue.add(
      'execute-flow',
      {
        automationId: automation.id,
        flowData: miniFlow,
        userId: req.user!.id,
        workspaceId,
        webhookPayload: req.body?.mockContext ?? {},
      },
      {
        jobId: `test-node:${automation.id}:${target.id}:${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    res.json({ message: 'Test job enqueued', jobId: job.id });
  } catch (error) {
    next(error);
  }
});
