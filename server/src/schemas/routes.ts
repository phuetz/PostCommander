// Zod schemas for routes that didn't previously have a schema declared.
// All schemas use .strict() to reject unknown keys (blocks mass-assignment of
// fields like role / isAdmin / userId via the body).

import { z } from 'zod';

// ── Outreach ─────────────────────────────────────────────────────────

export const outreachSimulateReplySchema = z
  .object({
    content: z.string().min(1).max(10_000),
  })
  .strict();

export const outreachOsintScanSchema = z
  .object({
    imageBase64: z.string().min(1).max(10_000_000), // ~10 MB base64
    deepScan: z.boolean().optional().default(false),
  })
  .strict();

export const outreachEnrichProfileSchema = z
  .object({
    profileUrl: z.string().url().max(2_000),
  })
  .strict();

export const outreachDeepDossierSchema = z
  .object({
    name: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
  })
  .strict();

export const outreachGenerateIcebreakerSchema = z
  .object({
    targetId: z.string().min(1).max(200),
    goal: z.string().min(1).max(1_000).optional(),
  })
  .strict();

export const outreachFindContactSchema = z
  .object({
    name: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
  })
  .strict();

export const outreachAddFromOsintSchema = z
  .object({
    campaignId: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    headline: z.string().max(500).optional(),
    profileUrl: z.string().url().max(2_000).optional(),
    icebreaker: z.string().min(1).max(5_000),
  })
  .strict();

// ── Agent (Chrome extension push endpoints) ──────────────────────────

export const agentSimulateCommentSchema = z
  .object({
    postId: z.string().min(1).max(200),
    content: z.string().min(1).max(10_000),
    authorName: z.string().min(1).max(200),
  })
  .strict();

const leadEntrySchema = z
  .object({
    name: z.string().min(1).max(200),
    profileUrl: z.string().url().max(2_000).optional(),
    headline: z.string().max(500).optional(),
    bio: z.string().max(5_000).optional(),
  })
  .strict();

export const agentScrapeLeadSchema = z
  .object({
    leads: z.array(leadEntrySchema).min(1).max(100),
    sourceUrl: z.string().url().max(2_000).optional(),
  })
  .strict();

export const agentGhostwriteCommentSchema = z
  .object({
    context: z.string().min(1).max(10_000),
  })
  .strict();

export const agentShadowProfileSchema = z
  .object({
    profileUrl: z.string().url().max(2_000),
    name: z.string().min(1).max(200),
    headline: z.string().max(500).optional(),
    about: z.string().max(10_000).optional(),
  })
  .strict();

export const agentEmergencyStopSchema = z
  .object({
    reason: z.string().min(1).max(1_000),
    sourceUrl: z.string().url().max(2_000).optional(),
  })
  .strict();

// ── Inbox ────────────────────────────────────────────────────────────

export const inboxReplySchema = z
  .object({
    content: z.string().min(1).max(10_000),
  })
  .strict();

// ── Workspaces ───────────────────────────────────────────────────────

export const workspaceInviteSchema = z
  .object({
    email: z.string().email().max(254),
    role: z.enum(['owner', 'admin', 'member']),
  })
  .strict();

// ── LLM-config bodies (provider + model + optional extras) ───────────
// Most "generate" / "score" / "agent-step" endpoints take this shape. The
// provider list mirrors `provider-factory.ts`. .strict() prevents callers from
// passing pricing/quota override fields by mistake.

const providerEnum = z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']);

export const llmConfigBaseSchema = z
  .object({
    providerId: providerEnum,
    modelId: z.string().min(1).max(200),
  })
  .strict();

export const analyticsAgentStepSchema = z
  .object({
    providerId: providerEnum,
    modelId: z.string().min(1).max(200),
    userMessage: z.string().max(10_000).optional(),
  })
  .strict();

// (pillars generate-ideas, styles/:id/generate, templates/:id/generate already
// have schemas in @postcommander/shared — not duplicated here.)

/**
 * Reusable empty body schema for mutating routes that take no payload
 * (DELETE, POST /logout, POST /cancel, etc.). Wrapping them with validate()
 * actively rejects requests carrying unexpected fields — defense in depth
 * against future controller refactors that would start trusting req.body.
 */
export const emptyBodySchema = z.object({}).strict();

// ── Posts (3 routes with simple bodies) ──────────────────────────────

export const postCommentBodySchema = z
  .object({
    content: z.string().min(1).max(10_000),
  })
  .strict();

const POST_STATUS_VALUES = ['draft', 'needs_approval', 'scheduled'] as const;
export const postStatusUpdateSchema = z
  .object({
    status: z.enum(POST_STATUS_VALUES),
  })
  .strict();

export const postRejectSchema = z
  .object({
    feedback: z.string().min(1).max(5_000),
  })
  .strict();

export const videoScriptGenerateSchema = z
  .object({
    topic: z.string().min(1).max(2_000),
    duration: z.enum(['short', 'medium', 'long']),
    platform: z.enum(['tiktok', 'reels', 'shorts']),
    tone: z.string().min(1).max(100),
    provider: providerEnum,
    model: z.string().min(1).max(200),
  })
  .strict();

export const stripeCancelSchema = z
  .object({
    email: z.string().email().optional(),
  })
  .strict();

