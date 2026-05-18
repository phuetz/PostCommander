import { randomUUID } from 'node:crypto';
import { generateText } from 'ai';
import { and, eq, sql, desc, asc } from 'drizzle-orm';
import { createModel } from '../llm/provider-factory.js';
import { getDrizzle } from '../../db/connection.js';
import { contentPillars, contentIdeas } from '../../db/schema.js';
import type { LLMProviderId } from '@postcommander/shared';

// ── Types ─────────────────────────────────────────────────────────────

export interface ContentPillar {
  id: string;
  name: string;
  description: string | null;
  color: string;
  topics: string[];
  postingFrequency: string;
  targetPlatforms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentIdea {
  id: string;
  pillarId: string;
  title: string;
  description: string | null;
  status: 'idea' | 'drafted' | 'scheduled' | 'published';
  postId: string | null;
  priority: number;
  createdAt: string;
}

export interface PillarWithCount extends ContentPillar {
  ideaCount: number;
  ideaCountByStatus: Record<string, number>;
}

export interface CreatePillarData {
  name: string;
  description?: string;
  color?: string;
  topics?: string[];
  postingFrequency?: string;
  targetPlatforms?: string[];
}

export interface UpdatePillarData {
  name?: string;
  description?: string;
  color?: string;
  topics?: string[];
  postingFrequency?: string;
  targetPlatforms?: string[];
}

export interface CreateIdeaData {
  title: string;
  description?: string;
  status?: string;
  priority?: number;
}

export interface UpdateIdeaData {
  title?: string;
  description?: string;
  status?: string;
  priority?: number;
  postId?: string | null;
}

export interface GenerateIdeasRequest {
  provider: LLMProviderId;
  model: string;
  count?: number;
}

export interface StrategyOverview {
  pillars: PillarWithCount[];
  totalIdeas: number;
  ideasByStatus: Record<string, number>;
}

// ── Helpers ───────────────────────────────────────────────────────────

function rowToPillar(row: any): ContentPillar {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color || '#3b82f6',
    topics: safeJsonParse(row.topics, []),
    postingFrequency: row.postingFrequency || 'weekly',
    targetPlatforms: safeJsonParse(row.targetPlatforms, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToIdea(row: any): ContentIdea {
  return {
    id: row.id,
    pillarId: row.pillarId,
    title: row.title,
    description: row.description,
    status: row.status,
    postId: row.postId,
    priority: row.priority ?? 0,
    createdAt: row.createdAt,
  };
}

function safeJsonParse(value: string | null | undefined, fallback: any): any {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

// ── Pillars CRUD ──────────────────────────────────────────────────────

export async function listPillars(userId: string): Promise<PillarWithCount[]> {
  const db = getDrizzle();

  const pillarsRows = await db
    .select()
    .from(contentPillars)
    .where(eq(contentPillars.userId, userId))
    .orderBy(asc(contentPillars.createdAt));

  const pillars = pillarsRows.map(rowToPillar);

  const result: PillarWithCount[] = [];
  for (const pillar of pillars) {
    const ideasRows = await db
      .select({ status: contentIdeas.status, count: sql<number>`count(*)` })
      .from(contentIdeas)
      .where(and(eq(contentIdeas.userId, userId), eq(contentIdeas.pillarId, pillar.id)))
      .groupBy(contentIdeas.status);

    const ideaCountByStatus: Record<string, number> = {};
    let total = 0;
    for (const row of ideasRows) {
      ideaCountByStatus[row.status] = Number(row.count);
      total += Number(row.count);
    }

    result.push({
      ...pillar,
      ideaCount: total,
      ideaCountByStatus,
    });
  }

  return result;
}

export async function getPillar(userId: string, id: string): Promise<ContentPillar | null> {
  const db = getDrizzle();
  const [row] = await db
    .select()
    .from(contentPillars)
    .where(and(eq(contentPillars.userId, userId), eq(contentPillars.id, id)))
    .limit(1);
  return row ? rowToPillar(row) : null;
}

export async function createPillar(userId: string, data: CreatePillarData): Promise<ContentPillar> {
  const db = getDrizzle();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(contentPillars).values({
    id,
    userId,
    name: data.name,
    description: data.description || null,
    color: data.color || '#3b82f6',
    topics: JSON.stringify(data.topics || []),
    postingFrequency: data.postingFrequency || 'weekly',
    targetPlatforms: JSON.stringify(data.targetPlatforms || []),
    createdAt: now,
    updatedAt: now,
  });

  const pillar = await getPillar(userId, id);
  return pillar!;
}

export async function updatePillar(
  userId: string,
  id: string,
  data: UpdatePillarData,
): Promise<ContentPillar | null> {
  const db = getDrizzle();
  const existing = await getPillar(userId, id);
  if (!existing) return null;

  const updates: any = {
    updatedAt: new Date().toISOString(),
  };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.color !== undefined) updates.color = data.color;
  if (data.topics !== undefined) updates.topics = JSON.stringify(data.topics);
  if (data.postingFrequency !== undefined) updates.postingFrequency = data.postingFrequency;
  if (data.targetPlatforms !== undefined)
    updates.targetPlatforms = JSON.stringify(data.targetPlatforms);

  await db
    .update(contentPillars)
    .set(updates)
    .where(and(eq(contentPillars.userId, userId), eq(contentPillars.id, id)));

  return getPillar(userId, id);
}

export async function deletePillar(userId: string, id: string): Promise<boolean> {
  const db = getDrizzle();
  const existing = await getPillar(userId, id);
  if (!existing) {
    return false;
  }

  await db
    .delete(contentPillars)
    .where(and(eq(contentPillars.userId, userId), eq(contentPillars.id, id)));
  return true;
}

// ── Ideas CRUD ────────────────────────────────────────────────────────

export async function listIdeas(userId: string, pillarId: string): Promise<ContentIdea[]> {
  const db = getDrizzle();
  const rows = await db
    .select()
    .from(contentIdeas)
    .where(and(eq(contentIdeas.userId, userId), eq(contentIdeas.pillarId, pillarId)))
    .orderBy(desc(contentIdeas.priority), desc(contentIdeas.createdAt));

  return rows.map(rowToIdea);
}

export async function getIdea(userId: string, ideaId: string): Promise<ContentIdea | null> {
  const db = getDrizzle();
  const [row] = await db
    .select()
    .from(contentIdeas)
    .where(and(eq(contentIdeas.userId, userId), eq(contentIdeas.id, ideaId)))
    .limit(1);
  return row ? rowToIdea(row) : null;
}

export async function createIdea(
  userId: string,
  pillarId: string,
  data: CreateIdeaData,
): Promise<ContentIdea> {
  const db = getDrizzle();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(contentIdeas).values({
    id,
    userId,
    pillarId,
    title: data.title,
    description: data.description || null,
    status: (data.status as any) || 'idea',
    priority: data.priority ?? 0,
    createdAt: now,
  });

  const idea = await getIdea(userId, id);
  return idea!;
}

export async function updateIdea(
  userId: string,
  ideaId: string,
  data: UpdateIdeaData,
): Promise<ContentIdea | null> {
  const db = getDrizzle();
  const existing = await getIdea(userId, ideaId);
  if (!existing) return null;

  const updates: any = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.postId !== undefined) updates.postId = data.postId;

  if (Object.keys(updates).length === 0) return existing;

  await db
    .update(contentIdeas)
    .set(updates)
    .where(and(eq(contentIdeas.userId, userId), eq(contentIdeas.id, ideaId)));

  return getIdea(userId, ideaId);
}

export async function deleteIdea(userId: string, ideaId: string): Promise<boolean> {
  const db = getDrizzle();
  const existing = await getIdea(userId, ideaId);
  if (!existing) {
    return false;
  }

  await db
    .delete(contentIdeas)
    .where(and(eq(contentIdeas.userId, userId), eq(contentIdeas.id, ideaId)));
  return true;
}

// ── AI Idea Generation ────────────────────────────────────────────────

export async function generateIdeas(
  userId: string,
  pillarId: string,
  request: GenerateIdeasRequest,
): Promise<ContentIdea[]> {
  const pillar = await getPillar(userId, pillarId);
  if (!pillar) throw new Error('Pillar not found');

  const model = await createModel(request.provider, request.model, userId);
  const count = request.count ?? 5;

  const system = `You are a content strategist helping plan social media content. Generate creative, specific content ideas for the given content pillar.

## Content Pillar: ${pillar.name}
## Description: ${pillar.description || 'No description'}
## Subtopics: ${pillar.topics.length > 0 ? pillar.topics.join(', ') : 'General'}
## Target Platforms: ${pillar.targetPlatforms.length > 0 ? pillar.targetPlatforms.join(', ') : 'All platforms'}

## Instructions:
Generate exactly ${count} unique content ideas for this pillar. Each idea should be:
- Specific enough to write about immediately
- Varied in approach (mix of educational, storytelling, opinion, how-to, list, etc.)
- Relevant to the pillar's theme and subtopics
- Engaging and shareable

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "ideas": [
    {
      "title": "Specific, compelling content idea title",
      "description": "Brief description of what the post should cover and the angle to take"
    }
  ]
}

Rules:
- Generate exactly ${count} ideas
- Titles should be concise but descriptive
- Descriptions should be 1-2 sentences
- Return ONLY valid JSON. No markdown, no extra text.`;

  const user = `Generate ${count} content ideas for the "${pillar.name}" content pillar.`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.8,
    maxTokens: 2048,
  });

  const parsed = parseJsonResponse(result.text);
  const ideas: ContentIdea[] = [];

  if (Array.isArray(parsed.ideas)) {
    for (const idea of parsed.ideas) {
      const created = await createIdea(userId, pillarId, {
        title: idea.title || 'Untitled Idea',
        description: idea.description || null,
        status: 'idea',
        priority: 0,
      });
      ideas.push(created);
    }
  }

  return ideas;
}

// ── Strategy Overview ─────────────────────────────────────────────────

export async function getStrategyOverview(userId: string): Promise<StrategyOverview> {
  const db = getDrizzle();
  const pillars = await listPillars(userId);

  const statusCounts = await db
    .select({ status: contentIdeas.status, count: sql<number>`count(*)` })
    .from(contentIdeas)
    .where(eq(contentIdeas.userId, userId))
    .groupBy(contentIdeas.status);

  const ideasByStatus: Record<string, number> = {};
  let totalIdeas = 0;
  for (const row of statusCounts) {
    ideasByStatus[row.status] = Number(row.count);
    totalIdeas += Number(row.count);
  }

  return {
    pillars,
    totalIdeas,
    ideasByStatus,
  };
}
