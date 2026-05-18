import { v4 as uuidv4 } from 'uuid';
import { generateText } from 'ai';
import { and, eq, desc } from 'drizzle-orm';
import { createModel } from '../llm/provider-factory.js';
import { getDrizzle } from '../../db/connection.js';
import { writingStyles as stylesTable } from '../../db/schema.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface WritingStyle {
  id: string;
  name: string;
  description: string | null;
  samplePosts: string[];
  analyzedStyle: StyleAnalysis | null;
  llmSystemPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StyleAnalysis {
  vocabulary: string;
  sentenceLength: string;
  emojiUsage: string;
  hashtagStyle: string;
  toneProfile: string;
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

function rowToStyle(row: any): WritingStyle {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    samplePosts: row.samplePosts ? JSON.parse(row.samplePosts) : [],
    analyzedStyle: row.analyzedStyle ? JSON.parse(row.analyzedStyle) : null,
    llmSystemPrompt: row.llmSystemPrompt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Analyze a set of sample posts to extract writing style patterns.
 */
export async function analyzeStyle(
  samplePosts: string[],
  provider: LLMProviderId,
  modelId: string,
  userId?: string,
): Promise<{ analysis: StyleAnalysis; systemPrompt: string }> {
  const model = await createModel(provider, modelId, userId);

  const system = `You are an expert writing style analyst. You specialize in deconstructing writing patterns to create detailed style profiles.

## Your Task
Analyze the provided sample posts and extract a detailed style profile. Then create a system prompt that would instruct an AI to write in this exact style.

## Analysis Dimensions:
1. **Vocabulary**: Level of complexity, jargon usage, word choice patterns, signature phrases
2. **Sentence Length**: Average sentence structure (short/medium/long), variation patterns, use of fragments
3. **Emoji Usage**: Frequency, types, placement patterns (none, minimal, moderate, heavy)
4. **Hashtag Style**: Count, placement, type (branded, generic, niche), integrated vs. appended
5. **Tone Profile**: Formal vs. casual, emotional register, humor usage, authority level, warmth

## Response format
You MUST respond in valid JSON:
{
  "analysis": {
    "vocabulary": "Detailed description of vocabulary patterns",
    "sentenceLength": "Description of sentence structure and length patterns",
    "emojiUsage": "Description of emoji usage patterns",
    "hashtagStyle": "Description of hashtag usage patterns",
    "toneProfile": "Description of overall tone and personality"
  },
  "systemPrompt": "A detailed system prompt that instructs an AI to write in this exact style. Be extremely specific about patterns, quirks, formatting preferences, and voice characteristics. Include examples of typical phrases and structures."
}

Return ONLY valid JSON.`;

  const samplesText = samplePosts.map((post, i) => `--- Sample ${i + 1} ---\n${post}`).join('\n\n');

  const user = `Analyze the writing style of these ${samplePosts.length} sample posts and create a replication system prompt:\n\n${samplesText}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.5,
    maxTokens: 2048,
  });

  const parsed = parseJsonResponse(result.text);

  return {
    analysis: parsed.analysis ?? {
      vocabulary: 'Standard',
      sentenceLength: 'Mixed',
      emojiUsage: 'Minimal',
      hashtagStyle: 'Standard',
      toneProfile: 'Professional',
    },
    systemPrompt: parsed.systemPrompt ?? 'Write in a professional and engaging style.',
  };
}

/**
 * Create a new writing style profile.
 */
export async function createStyle(
  userId: string,
  name: string,
  description: string,
  samplePosts: string[],
  provider: LLMProviderId,
  modelId: string,
): Promise<WritingStyle> {
  if (samplePosts.length < 3) {
    throw new Error('At least 3 sample posts are required for style analysis');
  }

  const { analysis, systemPrompt } = await analyzeStyle(samplePosts, provider, modelId, userId);

  const db = getDrizzle();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(stylesTable).values({
    id,
    userId,
    name,
    description: description || null,
    samplePosts: JSON.stringify(samplePosts),
    analyzedStyle: JSON.stringify(analysis),
    llmSystemPrompt: systemPrompt,
    createdAt: now,
    updatedAt: now,
  });

  const style = await getStyle(userId, id);
  return style!;
}

/**
 * Get all writing styles.
 */
export async function getStyles(userId: string): Promise<WritingStyle[]> {
  const db = getDrizzle();
  const rows = await db
    .select()
    .from(stylesTable)
    .where(eq(stylesTable.userId, userId))
    .orderBy(desc(stylesTable.createdAt));
  return rows.map(rowToStyle);
}

/**
 * Get a single writing style by ID.
 */
export async function getStyle(userId: string, id: string): Promise<WritingStyle | null> {
  const db = getDrizzle();
  const [row] = await db
    .select()
    .from(stylesTable)
    .where(and(eq(stylesTable.userId, userId), eq(stylesTable.id, id)))
    .limit(1);
  return row ? rowToStyle(row) : null;
}

/**
 * Delete a writing style.
 */
export async function deleteStyle(userId: string, id: string): Promise<boolean> {
  const db = getDrizzle();
  const existing = await getStyle(userId, id);
  if (!existing) {
    return false;
  }

  await db.delete(stylesTable).where(and(eq(stylesTable.userId, userId), eq(stylesTable.id, id)));
  return true;
}

/**
 * Generate a post in a specific writing style.
 */
export async function generateInStyle(
  userId: string,
  styleId: string,
  topic: string,
  platform: string,
  provider: LLMProviderId,
  modelId: string,
): Promise<{ content: string; hashtags: string[] }> {
  const style = await getStyle(userId, styleId);
  if (!style) {
    throw new Error('Writing style not found');
  }
  if (!style.llmSystemPrompt) {
    throw new Error('Writing style has not been analyzed yet');
  }

  const model = await createModel(provider, modelId, userId);

  const system = `${style.llmSystemPrompt}

## Additional Instructions:
- Platform: ${platform}
- Write a complete social media post in the style described above
- Match the tone, vocabulary, sentence structure, and formatting patterns exactly
- The post should feel like it was written by the same person who wrote the sample posts

## Response format
You MUST respond in valid JSON:
{
  "content": "The generated post in the specified writing style",
  "hashtags": ["hashtag1", "hashtag2"]
}

Return ONLY valid JSON. No markdown code fences.`;

  const user = `Write a ${platform} post about: ${topic}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.8,
    maxTokens: 2048,
  });

  const parsed = parseJsonResponse(result.text);
  return {
    content: parsed.content ?? '',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
  };
}
