import { pgTable, text, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';

// This is a template for migrating to PostgreSQL
// You will need to install 'pg' and 'drizzle-orm/node-postgres'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  plan: text('plan').notNull().default('free'),
  planStatus: text('plan_status').notNull().default('active'),
  postsUsedThisMonth: integer('posts_used_this_month').default(0),
  postsResetDate: timestamp('posts_reset_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  originalPrompt: text('original_prompt'),
  tone: text('tone'),
  llmProvider: text('llm_provider'),
  llmModel: text('llm_model'),
  platforms: jsonb('platforms').notNull(), // JSONB is better for PG
  platformVariants: jsonb('platform_variants'),
  hashtags: jsonb('hashtags'),
  status: text('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ... other tables would follow similar logic with PG-specific types
