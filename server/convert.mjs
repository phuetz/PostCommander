import fs from 'fs';

let content = fs.readFileSync('src/db/schema.ts', 'utf-8');

// Imports
content = content.replace(/drizzle-orm\/sqlite-core/g, 'drizzle-orm/pg-core');
content = content.replace(/sqliteTable/g, 'pgTable');
content = content.replace(/text, integer, index, uniqueIndex/g, 'text, integer, boolean, timestamp, index, uniqueIndex, pgTable');
content = content.replace(/import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm\/pg-core';/g, "import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';");
// the regex above was getting messy, let's just do:
content = content.replace(/import \{ pgTable, text, integer, index, uniqueIndex \} from 'drizzle-orm\/pg-core';/, "import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';");

// Booleans
content = content.replace(/integer\('is_replied'\)\.default\(0\)/g, "boolean('is_replied').default(false)");
content = content.replace(/integer\('requires_human'\)\.default\(0\)/g, "boolean('requires_human').default(false)");
content = content.replace(/integer\('is_resolved'\)\.default\(0\)/g, "boolean('is_resolved').default(false)");
content = content.replace(/integer\('cancel_at_period_end'\)\.default\(0\)/g, "boolean('cancel_at_period_end').default(false)");
content = content.replace(/integer\('has_auto_plugged'\)\.default\(0\)/g, "boolean('has_auto_plugged').default(false)");

// Timestamps with defaults
content = content.replace(/text\('([a-z_]+_at)'\)\.notNull\(\)\.default\('CURRENT_TIMESTAMP'\)/g, "timestamp('$1').notNull().defaultNow()");
content = content.replace(/text\('([a-z_]+_at)'\)\.default\('CURRENT_TIMESTAMP'\)/g, "timestamp('$1').defaultNow()");

// Other Timestamps
content = content.replace(/text\('scheduled_at'\)/g, "timestamp('scheduled_at')");
content = content.replace(/text\('published_at'\)/g, "timestamp('published_at')");
content = content.replace(/text\('last_synced_at'\)/g, "timestamp('last_synced_at')");
content = content.replace(/text\('current_period_start'\)/g, "timestamp('current_period_start')");
content = content.replace(/text\('current_period_end'\)/g, "timestamp('current_period_end')");
content = content.replace(/text\('canceled_at'\)/g, "timestamp('canceled_at')");
content = content.replace(/text\('token_expires'\)/g, "timestamp('token_expires')");
content = content.replace(/text\('posts_reset_date'\)/g, "timestamp('posts_reset_date')");
content = content.replace(/text\('user_created_at'\)/g, "timestamp('user_created_at')");
content = content.replace(/text\('last_generated_at'\)/g, "timestamp('last_generated_at')");
content = content.replace(/text\('last_contacted_at'\)/g, "timestamp('last_contacted_at')");
content = content.replace(/text\('sent_at'\)/g, "timestamp('sent_at')");

fs.writeFileSync('src/db/schema.ts', content);
console.log('Schema converted.');
