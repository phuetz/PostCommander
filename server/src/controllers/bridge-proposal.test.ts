/**
 * Bridge proposal — auth + payload + LLM happy path.
 *
 * Uses supertest against the real app, mocking only the LLM call so we
 * exercise the HMAC verification, body parsing, and SSE framing for real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createHmac } from 'node:crypto';

vi.mock('../db/connection.js', () => ({
  getDb: vi.fn(() => ({ prepare: () => ({ get: () => undefined }) })),
  getDrizzle: vi.fn(() => ({ query: {} })),
  initDb: vi.fn(),
  closeDb: vi.fn(),
}));

vi.mock('../services/llm/provider-factory.js', () => ({
  createModel: vi.fn(() => ({ provider: 'fake', modelId: 'fake' })),
}));

const generateTextMock = vi.fn();
vi.mock('ai', () => ({
  generateText: (args: unknown) => generateTextMock(args),
}));

const TOKEN = 'test-bridge-token';
const HMAC_SECRET = 'test-hmac-secret-please-rotate';

process.env.ESN_BRIDGE_TOKEN = TOKEN;
process.env.ESN_BRIDGE_HMAC_SECRET = HMAC_SECRET;

const { createApp } = await import('../app.js');
const app = createApp();

function sign(body: string, ts: string = String(Date.now())): { sig: string; ts: string } {
  const sig =
    'sha256=' + createHmac('sha256', HMAC_SECRET).update(`${ts}.${body}`).digest('hex');
  return { sig, ts };
}

const validInput = {
  opportunityId: 42,
  tenantId: 1,
  opportunity: {
    title: 'Refonte data',
    description: 'Modernisation pipeline analytics',
    value: 120_000,
    currency: 'EUR',
  },
  client: { name: 'Acme SA', sector: 'banque' },
  referenceProjects: [{ name: 'Projet 2024' }],
  rateCard: [
    { seniority: 'intermediate', dailyRate: 600 },
    { seniority: 'senior', dailyRate: 800 },
  ],
};

const validDraftJson = JSON.stringify({
  intro: 'Bonjour, voici notre proposition.',
  contexteClient: 'Acme évolue dans la banque.',
  approche: 'Cadrage, build, run.',
  equipeProposee: [{ role: 'Lead', seniority: 'senior', allocationPct: 80 }],
  planning: 'S1-S16',
  livrables: ['Note', 'Archi', 'Code'],
  budgetEstimate: { totalDays: 80, suggestedTotal: 56_000, currency: 'EUR' },
  conditions: 'Validité 30j.',
});

describe('POST /api/bridge/proposal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateTextMock.mockResolvedValue({ text: validDraftJson });
  });

  it('rejects requests without a Bearer token', async () => {
    const body = JSON.stringify({ contentType: 'proposal', input: validInput });
    const signed = sign(body);
    const res = await request(app)
      .post('/api/bridge/proposal')
      .set('Content-Type', 'application/json')
      .set('X-PC-Timestamp', signed.ts)
      .set('X-PC-Signature', signed.sig)
      .send(body);
    expect(res.status).toBe(401);
  });

  it('rejects requests with a bad signature', async () => {
    const body = JSON.stringify({ contentType: 'proposal', input: validInput });
    const signed = sign(body);
    const res = await request(app)
      .post('/api/bridge/proposal')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${TOKEN}`)
      .set('X-PC-Signature', 'sha256=deadbeef')
      .send(body);
    expect(res.status).toBe(401);
  });

  it('rejects malformed payloads', async () => {
    const body = JSON.stringify({ contentType: 'proposal', input: { not: 'valid' } });
    const signed = sign(body);
    const res = await request(app)
      .post('/api/bridge/proposal')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${TOKEN}`)
      .set('X-PC-Timestamp', signed.ts)
      .set('X-PC-Signature', signed.sig)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('streams a valid proposal draft when auth + payload are good', async () => {
    const body = JSON.stringify({ contentType: 'proposal', input: validInput });
    const signed = sign(body);
    const res = await request(app)
      .post('/api/bridge/proposal')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${TOKEN}`)
      .set('X-PC-Timestamp', signed.ts)
      .set('X-PC-Signature', signed.sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');

    // Parse the SSE data events
    const events = res.text
      .split('\n\n')
      .map((b) => b.trim())
      .filter((b) => b.startsWith('data:'))
      .map((b) => JSON.parse(b.replace(/^data:\s*/, '')));

    const final = events.find((e) => e.done && e.final);
    expect(final).toBeDefined();
    expect(final.final.intro).toContain('Bonjour');
    expect(final.final.equipeProposee).toHaveLength(1);
    // Budget recomputed from rateCard average × totalDays
    expect(final.final.budgetEstimate.currency).toBe('EUR');
    expect(final.final.budgetEstimate.totalDays).toBeGreaterThan(0);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('tolerates markdown-fenced JSON from the LLM', async () => {
    generateTextMock.mockResolvedValue({
      text: '```json\n' + validDraftJson + '\n```',
    });
    const body = JSON.stringify({ contentType: 'proposal', input: validInput });
    const signed = sign(body);
    const res = await request(app)
      .post('/api/bridge/proposal')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${TOKEN}`)
      .set('X-PC-Timestamp', signed.ts)
      .set('X-PC-Signature', signed.sig)
      .send(body);

    expect(res.status).toBe(200);
    const events = res.text
      .split('\n\n')
      .filter((b) => b.trim().startsWith('data:'))
      .map((b) => JSON.parse(b.trim().replace(/^data:\s*/, '')));
    expect(events.some((e) => e.done && e.final?.intro)).toBe(true);
  });

  it('emits an error event when the LLM output is unparseable', async () => {
    generateTextMock.mockResolvedValue({ text: 'definitely not json' });
    const body = JSON.stringify({ contentType: 'proposal', input: validInput });
    const signed = sign(body);
    const res = await request(app)
      .post('/api/bridge/proposal')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${TOKEN}`)
      .set('X-PC-Timestamp', signed.ts)
      .set('X-PC-Signature', signed.sig)
      .send(body);

    expect(res.status).toBe(200);
    const events = res.text
      .split('\n\n')
      .filter((b) => b.trim().startsWith('data:'))
      .map((b) => JSON.parse(b.trim().replace(/^data:\s*/, '')));
    expect(events.some((e) => e.error)).toBe(true);
  });
});
