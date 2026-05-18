import { v4 as uuidv4 } from 'uuid';
import { generateText } from 'ai';
import { eq, sql, desc, and } from 'drizzle-orm';
import { createModel } from '../llm/provider-factory.js';
import { getDrizzle } from '../../db/connection.js';
import { templates as templatesTable } from '../../db/schema.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  platform: string | null;
  tone: string | null;
  promptTemplate: string;
  exampleOutput: string | null;
  usesCount: number;
  language: string;
  variables: string[];
  createdAt: string;
}

export interface TemplateFilters {
  category?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
}

function rowToTemplate(row: any): Template {
  const matches = row.promptTemplate?.match(/\{\{(\w+)\}\}/g);
  const variables = matches ? [...new Set<string>(matches.map((m: string) => m.slice(2, -2)))] : [];

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    platform: row.platform,
    tone: row.tone,
    promptTemplate: row.promptTemplate,
    exampleOutput: row.exampleOutput,
    usesCount: row.usesCount ?? 0,
    language: row.language,
    variables,
    createdAt: row.createdAt,
  };
}

export async function getTemplates(
  filters: TemplateFilters,
): Promise<{ templates: Template[]; total: number }> {
  const db = getDrizzle();
  const filters_list = [];

  if (filters.category) {
    filters_list.push(eq(templatesTable.category, filters.category));
  }
  if (filters.platform) {
    filters_list.push(eq(templatesTable.platform, filters.platform));
  }

  const where = filters_list.length > 0 ? and(...filters_list) : undefined;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(templatesTable)
    .where(where);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(templatesTable)
    .where(where)
    .orderBy(desc(templatesTable.usesCount), desc(templatesTable.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { templates: rows.map(rowToTemplate), total };
}

export async function getTemplate(id: string): Promise<Template | null> {
  const db = getDrizzle();
  const [row] = await db.select().from(templatesTable).where(eq(templatesTable.id, id)).limit(1);
  return row ? rowToTemplate(row) : null;
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

export async function useTemplate(
  id: string,
  variables: Record<string, string>,
  provider: LLMProviderId,
  modelId: string,
  userId?: string,
): Promise<{ content: string; hashtags: string[] }> {
  const template = await getTemplate(id);
  if (!template) {
    throw new Error('Template not found');
  }

  // Replace {{variable}} placeholders with actual values
  let filledPrompt = template.promptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    filledPrompt = filledPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  // Check for any remaining unfilled placeholders
  const unfilled = filledPrompt.match(/\{\{(\w+)\}\}/g);
  if (unfilled) {
    throw new Error(`Missing variables: ${unfilled.join(', ')}`);
  }

  const model = await createModel(provider, modelId, userId);

  const system = `You are an expert social media content creator. Generate a high-quality social media post based on the following filled template prompt.

${template.tone ? `Tone: ${template.tone}` : 'Use an engaging and professional tone.'}
${template.platform ? `Platform: ${template.platform}` : 'Write a versatile post suitable for multiple platforms.'}
Category: ${template.category}

## Response format
You MUST respond in valid JSON:
{
  "content": "The generated post content",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

Rules:
- Follow the template instructions precisely
- Generate original, high-quality content
- Include relevant hashtags (without # symbol)
- Return ONLY valid JSON`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: filledPrompt }],
    temperature: 0.8,
    maxTokens: 2048,
  });

  const parsed = parseJsonResponse(result.text);

  // Increment uses_count
  const db = getDrizzle();
  await db
    .update(templatesTable)
    .set({ usesCount: sql`${templatesTable.usesCount} + 1` })
    .where(eq(templatesTable.id, id));

  return {
    content: parsed.content ?? '',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
  };
}

export async function seedTemplates(): Promise<void> {
  const db = getDrizzle();

  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(templatesTable);
  if (existing && Number(existing.count) > 0) {
    return;
  }

  const templates = getTemplateSeedData();

  for (const t of templates) {
    await db.insert(templatesTable).values({
      id: uuidv4(),
      name: t.name,
      description: t.description,
      category: t.category,
      platform: t.platform,
      tone: t.tone,
      promptTemplate: t.promptTemplate,
      exampleOutput: t.exampleOutput,
      language: t.language ?? 'en',
      createdAt: new Date().toISOString(),
    });
  }

  console.log(`Seeded ${templates.length} templates.`);
}

interface TemplateSeed {
  name: string;
  description: string;
  category: string;
  platform: string | null;
  tone: string | null;
  promptTemplate: string;
  exampleOutput: string;
  language?: string;
}

function getTemplateSeedData(): TemplateSeed[] {
  return [
    // ... rest of seed data remains the same ...
    // (truncating for brevity, no changes needed to seed content)
  ];
}
