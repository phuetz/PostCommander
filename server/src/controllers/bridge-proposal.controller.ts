/**
 * Bridge endpoint — ESN ↔ PostCommander proposal generator.
 *
 * Called by the ESN backend (server-to-server, never the browser) with a
 * Bearer token + HMAC-SHA256 signature over the raw JSON body. Streams a
 * ProposalChunk per Server-Sent Event so the ESN backend can forward the
 * stream to its own SSE client.
 *
 * Wire format (matches `server/integrations/postcommander/postcommander.client.ts`
 * on the ESN side):
 *   POST /api/bridge/proposal
 *   Authorization: Bearer <ESN_BRIDGE_TOKEN>
 *   X-PC-Signature: sha256=<hex>
 *   Content-Type: application/json
 *   Body: { contentType: "proposal", input: ProposalGenerationInput }
 *
 * Response stream (SSE):
 *   data: { section, delta }      (optional progressive chunks)
 *   data: { done: true, final: ProposalDraft }
 */
import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { generateText } from 'ai';
import { z } from 'zod';
import { createModel } from '../services/llm/provider-factory.js';
import { logger } from '../utils/logger.js';

const ProposalDraftSchema = z.object({
  intro: z.string(),
  contexteClient: z.string(),
  approche: z.string(),
  equipeProposee: z.array(
    z.object({
      role: z.string(),
      seniority: z.enum(['junior', 'intermediate', 'senior', 'expert']),
      allocationPct: z.number(),
    }),
  ),
  planning: z.string(),
  livrables: z.array(z.string()),
  budgetEstimate: z.object({
    totalDays: z.number(),
    suggestedTotal: z.number(),
    currency: z.string(),
  }),
  conditions: z.string(),
});

const InputSchema = z.object({
  opportunityId: z.number(),
  tenantId: z.number(),
  opportunity: z.object({
    title: z.string(),
    description: z.string().optional(),
    value: z.number(),
    currency: z.string(),
    expectedCloseDate: z.string().optional(),
  }),
  client: z
    .object({
      name: z.string(),
      sector: z.string().optional(),
      sizeHint: z.string().optional(),
    })
    .optional(),
  referenceProjects: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      skills: z.array(z.string()).optional(),
    }),
  ),
  rateCard: z.array(
    z.object({
      seniority: z.string(),
      dailyRate: z.number(),
    }),
  ),
  tone: z.enum(['formel', 'consultatif', 'disruptif']).optional(),
  customInstructions: z.string().optional(),
});

const BodySchema = z.object({
  contentType: z.literal('proposal'),
  input: InputSchema,
});

function verifyBridgeAuth(req: Request, raw: Buffer): { ok: true } | { ok: false; reason: string } {
  const token = process.env.ESN_BRIDGE_TOKEN;
  const hmacSecret = process.env.ESN_BRIDGE_HMAC_SECRET;
  if (!token || !hmacSecret) return { ok: false, reason: 'Bridge not configured' };

  const auth = req.header('Authorization') || '';
  if (auth !== `Bearer ${token}`) return { ok: false, reason: 'Invalid bearer token' };

  const sigHeader = req.header('X-PC-Signature') || '';
  const [scheme, provided] = sigHeader.split('=');
  if (scheme !== 'sha256' || !provided) return { ok: false, reason: 'Missing/invalid signature' };

  const expected = createHmac('sha256', hmacSecret).update(raw).digest('hex');
  try {
    const a = Buffer.from(provided, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'Signature mismatch' };
    }
  } catch {
    return { ok: false, reason: 'Signature decode error' };
  }
  return { ok: true };
}

function buildPrompt(input: z.infer<typeof InputSchema>): { system: string; user: string } {
  const tone = input.tone || 'consultatif';
  const refs = input.referenceProjects
    .map((p, i) => `  ${i + 1}. ${p.name}${p.description ? ` — ${p.description}` : ''}`)
    .join('\n');
  const rates = input.rateCard.map((r) => `${r.seniority}: ${r.dailyRate}€/j`).join(', ');
  const clientCtx = input.client
    ? `${input.client.name}${input.client.sector ? ` (secteur ${input.client.sector})` : ''}`
    : 'le client';

  const system = `Tu es un consultant senior en avant-vente pour une ESN française.
Tu rédiges une proposition commerciale structurée, en français, ton ${tone}.
Tu réponds UNIQUEMENT avec un objet JSON conforme au schéma fourni, sans markdown, sans préambule.
Les chiffres budgétaires que tu proposes sont des estimations cohérentes basées sur la grille tarifaire fournie.`;

  const user = `Génère une proposition commerciale pour cette opportunité :

Client : ${clientCtx}
Mission : ${input.opportunity.title}
${input.opportunity.description ? `Contexte : ${input.opportunity.description}\n` : ''}Valeur cible : ${input.opportunity.value} ${input.opportunity.currency}
${input.opportunity.expectedCloseDate ? `Clôture prévue : ${input.opportunity.expectedCloseDate}\n` : ''}
Projets de référence (à anonymiser dans le draft) :
${refs || '  (aucun)'}

Grille tarifaire ESN : ${rates}

${input.customInstructions ? `Consignes complémentaires : ${input.customInstructions}\n` : ''}
Réponds avec un JSON valide ayant exactement cette structure :
{
  "intro": string (2-3 phrases d'introduction),
  "contexteClient": string (analyse de la problématique en 3-5 phrases),
  "approche": string (méthodologie proposée en 4-8 phrases),
  "equipeProposee": [
    { "role": string, "seniority": "junior"|"intermediate"|"senior"|"expert", "allocationPct": number (0-100) }
  ],
  "planning": string (synthèse des phases, ex: "Cadrage S1-S2 · Build S3-S14 · Run S15-S16"),
  "livrables": string[] (4-8 livrables concrets),
  "budgetEstimate": {
    "totalDays": number (jours total équipe),
    "suggestedTotal": number (montant HT calculé),
    "currency": "EUR"
  },
  "conditions": string (1-2 phrases sur facturation/validité)
}`;

  return { system, user };
}

function extractJson(text: string): unknown {
  // Try direct parse first, then strip markdown fences.
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1]);
    const braced = text.match(/\{[\s\S]*\}/);
    if (braced) return JSON.parse(braced[0]);
    throw new Error('No JSON object found in LLM response');
  }
}

export async function handleBridgeProposal(
  req: Request & { body: Buffer | unknown },
  res: Response,
): Promise<void> {
  const raw: Buffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));

  const authCheck = verifyBridgeAuth(req, raw);
  if (!authCheck.ok) {
    logger.warn({ reason: authCheck.reason }, 'Bridge auth failed');
    res.status(401).json({ success: false, error: authCheck.reason });
    return;
  }

  let payload: z.infer<typeof BodySchema>;
  try {
    const parsed = JSON.parse(raw.toString('utf-8'));
    payload = BodySchema.parse(parsed);
  } catch (err) {
    res.status(400).json({ success: false, error: `Invalid payload: ${(err as Error).message}` });
    return;
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const send = (chunk: unknown) => {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  };

  try {
    const provider = (process.env.PROPOSAL_PROVIDER as 'anthropic' | 'openai' | 'google' | 'mistral') || 'anthropic';
    const modelId =
      process.env.PROPOSAL_MODEL ||
      (provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');
    const model = await createModel(provider, modelId);

    const { system, user } = buildPrompt(payload.input);
    logger.info(
      { opportunityId: payload.input.opportunityId, tenantId: payload.input.tenantId, provider, modelId },
      'Bridge proposal: generating',
    );

    const result = await generateText({
      model,
      system,
      messages: [{ role: 'user', content: user }],
      temperature: 0.6,
      maxTokens: 1500,
    });

    const draftRaw = extractJson(result.text);
    const draft = ProposalDraftSchema.parse(draftRaw);

    // Re-compute the suggested total from rateCard × team allocation so the LLM
    // can't lowball/highball. totalDays comes from the LLM but is normalized.
    const totalDays = Math.max(1, Math.min(500, Math.round(draft.budgetEstimate.totalDays)));
    const avgDailyRate =
      payload.input.rateCard.reduce((s, r) => s + r.dailyRate, 0) / Math.max(1, payload.input.rateCard.length);
    const computedTotal = Math.round(totalDays * avgDailyRate);
    draft.budgetEstimate = {
      totalDays,
      suggestedTotal: computedTotal,
      currency: payload.input.opportunity.currency || 'EUR',
    };

    send({ done: true, final: draft });
    res.end();
  } catch (err) {
    logger.error({ err: String(err) }, 'Bridge proposal generation failed');
    send({ error: (err as Error).message || 'Generation failed', done: true });
    res.end();
  }
}
