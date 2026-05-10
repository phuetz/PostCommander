import { v4 as uuidv4 } from 'uuid';
import { eq, sql, desc, and, like, or } from 'drizzle-orm';
import { getDrizzle } from '../../db/connection.js';
import { viralPosts as postsTable } from '../../db/schema.js';

export interface ViralPost {
  id: string;
  platform: string;
  content: string;
  authorName: string | null;
  authorHandle: string | null;
  likes: number;
  comments: number;
  shares: number;
  category: string | null;
  tags: string[];
  language: string;
  createdAt: string;
}

export interface ViralFilters {
  platform?: string;
  category?: string;
  language?: string;
  page?: number;
  pageSize?: number;
}

function rowToViralPost(row: any): ViralPost {
  return {
    id: row.id,
    platform: row.platform,
    content: row.content,
    authorName: row.authorName,
    authorHandle: row.authorHandle,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    shares: row.shares ?? 0,
    category: row.category,
    tags: row.tags ? JSON.parse(row.tags) : [],
    language: row.language || 'en',
    createdAt: row.createdAt,
  };
}

export async function getViralPosts(
  filters: ViralFilters,
): Promise<{ posts: ViralPost[]; total: number }> {
  const db = getDrizzle();
  const filters_list = [];

  if (filters.platform) {
    filters_list.push(eq(postsTable.platform, filters.platform));
  }
  if (filters.category) {
    filters_list.push(eq(postsTable.category, filters.category));
  }
  if (filters.language) {
    filters_list.push(eq(postsTable.language, filters.language));
  }

  const where = filters_list.length > 0 ? and(...filters_list) : undefined;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postsTable)
    .where(where);
  const total = Number(totalResult?.count ?? 0);

  const rows = await db
    .select()
    .from(postsTable)
    .where(where)
    .orderBy(desc(postsTable.likes))
    .limit(pageSize)
    .offset(offset);

  return { posts: rows.map(rowToViralPost), total };
}

export async function searchViralPosts(query: string): Promise<ViralPost[]> {
  const db = getDrizzle();
  const pattern = `%${query}%`;

  const rows = await db
    .select()
    .from(postsTable)
    .where(
      or(
        like(postsTable.content, pattern),
        like(postsTable.authorName, pattern),
        like(postsTable.tags, pattern),
      ),
    )
    .orderBy(desc(postsTable.likes))
    .limit(50);

  return rows.map(rowToViralPost);
}

export async function getCategories(): Promise<string[]> {
  const db = getDrizzle();
  const rows = await db
    .select({ category: postsTable.category })
    .from(postsTable)
    .where(sql`${postsTable.category} IS NOT NULL`)
    .groupBy(postsTable.category)
    .orderBy(postsTable.category);

  return rows.map((r) => r.category as string);
}

export async function seedViralPosts(): Promise<void> {
  const db = getDrizzle();

  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
  if (existing && Number(existing.count) > 0) {
    return; // Already seeded
  }

  const posts = getViralSeedData();

  for (const post of posts) {
    await db.insert(postsTable).values({
      id: uuidv4(),
      platform: post.platform,
      content: post.content,
      authorName: post.authorName,
      authorHandle: post.authorHandle,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      category: post.category,
      tags: JSON.stringify(post.tags),
      language: post.language ?? 'en',
      createdAt: new Date().toISOString(),
    });
  }

  console.log(`Seeded ${posts.length} viral posts.`);
}

interface ViralSeed {
  platform: string;
  content: string;
  authorName: string;
  authorHandle: string;
  likes: number;
  comments: number;
  shares: number;
  category: string;
  tags: string[];
  language?: string;
}

function getViralSeedData(): ViralSeed[] {
  return [
    // ... rest of seed data remains the same ...
  ];
}
