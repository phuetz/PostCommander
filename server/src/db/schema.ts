import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  plan: text('plan').notNull().default('free'),
  planStatus: text('plan_status').notNull().default('active'),
  postsUsedThisMonth: integer('posts_used_this_month').default(0),
  postsResetDate: timestamp('posts_reset_date', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'owner', 'admin', 'member'
    joinedAt: timestamp('joined_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceUserIdx: uniqueIndex('idx_workspace_members_user').on(table.workspaceId, table.userId),
  }),
);

export const settings = pgTable(
  'settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_settings_user').on(table.userId),
    userKeyIdx: uniqueIndex('idx_settings_user_key').on(table.userId, table.key),
  }),
);

export const platformConnections = pgTable(
  'platform_connections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    accountName: text('account_name'),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpires: timestamp('token_expires', { mode: 'string' }),
    scopes: text('scopes'),
    metadata: text('metadata'),
    connectedAt: timestamp('connected_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_platform_connections_user').on(table.userId),
    userPlatformIdx: uniqueIndex('idx_platform_connections_user_platform').on(
      table.userId,
      table.platform,
    ),
  }),
);

export const posts = pgTable(
  'posts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    originalPrompt: text('original_prompt'),
    tone: text('tone'),
    originalPostId: text('original_post_id'), // For evergreen recycled posts
    llmProvider: text('llm_provider'),
    llmModel: text('llm_model'),
    platforms: text('platforms').notNull(), // JSON string array
    platformVariants: text('platform_variants'), // JSON object
    hashtags: text('hashtags'), // JSON string array
    autoPlugContent: text('auto_plug_content'),
    autoPlugThreshold: integer('auto_plug_threshold'),
    status: text('status').notNull().default('draft'), // draft, needs_approval, scheduled, published, failed, rejected
    scheduledAt: timestamp('scheduled_at', { mode: 'string' }),
    publishedAt: timestamp('published_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_posts_user').on(table.userId),
  }),
);

export const postApprovals = pgTable(
  'post_approvals',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull(), // 'approved' or 'rejected'
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    postIdIdx: index('idx_post_approvals_post_id').on(table.postId),
  }),
);

export const postComments = pgTable(
  'post_comments',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    postIdIdx: index('idx_post_comments_post_id').on(table.postId),
    userIdx: index('idx_post_comments_user_id').on(table.userId),
  }),
);

export const postPublications = pgTable('post_publications', {
  id: text('id').primaryKey(),
  postId: text('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  connectionId: text('connection_id').references(() => platformConnections.id),
  platformPostId: text('platform_post_id'),
  platformUrl: text('platform_url'),
  status: text('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  commentsCount: integer('comments_count').default(0),
  shares: integer('shares').default(0),
  hasAutoPlugged: boolean('has_auto_plugged').default(false),
  lastSyncedAt: timestamp('last_synced_at', { mode: 'string' }),
  publishedAt: timestamp('published_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const socialComments = pgTable('social_comments', {
  id: text('id').primaryKey(),
  postPublicationId: text('post_publication_id')
    .notNull()
    .references(() => postPublications.id, { onDelete: 'cascade' }),
  platformCommentId: text('platform_comment_id').notNull(),
  authorName: text('author_name').notNull(),
  authorHandle: text('author_handle'),
  authorAvatarUrl: text('author_avatar_url'),
  content: text('content').notNull(),
  isReplied: boolean('is_replied').default(false), // 0 or 1 for SQLite boolean
  replyContent: text('reply_content'),
  leadScore: integer('lead_score'),
  leadStatus: text('lead_status').default('unscored'),
  leadReason: text('lead_reason'),
  agentState: text('agent_state'), // JSON string of the conversation history
  requiresHuman: boolean('requires_human').default(false), // 0 or 1
  isResolved: boolean('is_resolved').default(false), // 0 or 1
  publishedAt: timestamp('published_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').unique().notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  plan: text('plan').notNull(),
  interval: text('interval').notNull(),
  status: text('status').notNull(),
  currentPeriodStart: timestamp('current_period_start', { mode: 'string' }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'string' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeInvoiceId: text('stripe_invoice_id').unique().notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('eur'),
  status: text('status').notNull(),
  invoiceUrl: text('invoice_url'),
  invoicePdf: text('invoice_pdf'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const deletedAccountAudits = pgTable(
  'deleted_account_audits',
  {
    id: text('id').primaryKey(),
    originalUserId: text('original_user_id').notNull(),
    emailHash: text('email_hash').notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    plan: text('plan').notNull(),
    planStatus: text('plan_status').notNull(),
    userCreatedAt: timestamp('user_created_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }).notNull().defaultNow(),
    source: text('source').notNull().default('self_service'),
    snapshot: text('snapshot').notNull(),
  },
  (table) => ({
    originalUserIdx: uniqueIndex('idx_deleted_account_audits_original_user').on(
      table.originalUserId,
    ),
    deletedAtIdx: index('idx_deleted_account_audits_deleted_at').on(table.deletedAt),
    emailHashIdx: index('idx_deleted_account_audits_email_hash').on(table.emailHash),
  }),
);

export const deletedBillingRecords = pgTable(
  'deleted_billing_records',
  {
    id: text('id').primaryKey(),
    deletedAccountAuditId: text('deleted_account_audit_id')
      .notNull()
      .references(() => deletedAccountAudits.id, { onDelete: 'cascade' }),
    recordType: text('record_type').notNull(),
    stripeRecordId: text('stripe_record_id').notNull(),
    status: text('status').notNull(),
    snapshot: text('snapshot').notNull(),
    archivedAt: timestamp('archived_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    auditIdx: index('idx_deleted_billing_records_audit').on(table.deletedAccountAuditId),
    recordIdx: uniqueIndex('idx_deleted_billing_records_record').on(
      table.deletedAccountAuditId,
      table.recordType,
      table.stripeRecordId,
    ),
  }),
);

export const viralPosts = pgTable('viral_posts', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(),
  content: text('content').notNull(),
  authorName: text('author_name'),
  authorHandle: text('author_handle'),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  category: text('category'),
  tags: text('tags'), // JSON string array
  language: text('language').default('en'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  platform: text('platform'),
  tone: text('tone'),
  promptTemplate: text('prompt_template').notNull(),
  exampleOutput: text('example_output'),
  usesCount: integer('uses_count').default(0),
  language: text('language').default('en'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const writingStyles = pgTable(
  'writing_styles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    samplePosts: text('sample_posts').notNull(), // JSON string array
    analyzedStyle: text('analyzed_style'), // JSON object
    llmSystemPrompt: text('llm_system_prompt'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_writing_styles_user').on(table.userId),
  }),
);

export const generatedImages = pgTable(
  'generated_images',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
    prompt: text('prompt').notNull(),
    provider: text('provider').notNull(),
    imageUrl: text('image_url'),
    imagePath: text('image_path'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_generated_images_user').on(table.userId),
  }),
);

export const contentPillars = pgTable(
  'content_pillars',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color').default('#3b82f6'),
    topics: text('topics'), // JSON string array
    postingFrequency: text('posting_frequency').default('weekly'),
    targetPlatforms: text('target_platforms'), // JSON string array
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_content_pillars_user').on(table.userId),
  }),
);

export const contentIdeas = pgTable(
  'content_ideas',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    pillarId: text('pillar_id')
      .notNull()
      .references(() => contentPillars.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('idea'),
    postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
    priority: integer('priority').default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_content_ideas_user').on(table.userId),
  }),
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const autoBlogConfigs = pgTable(
  'auto_blog_configs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    articleType: text('article_type').notNull().default('fond-technique'),
    frequency: text('frequency').notNull().default('daily'),
    provider: text('provider').notNull().default('openai'),
    model: text('model').notNull().default('gpt-4o'),
    authorName: text('author_name'),
    authorRole: text('author_role'),
    authorReferences: text('author_references'),
    status: text('status').notNull().default('active'),
    lastGeneratedAt: timestamp('last_generated_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_auto_blog_configs_user').on(table.userId),
    statusIdx: index('idx_auto_blog_configs_status').on(table.status),
  }),
);

export const outreachCampaigns = pgTable(
  'outreach_campaigns',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    targetKeywords: text('target_keywords').notNull(),
    targetActivity: text('target_activity'),
    campaignGoal: text('campaign_goal').notNull(),
    platform: text('platform').notNull(),
    dailyLimit: integer('daily_limit').notNull().default(15),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_outreach_campaigns_user').on(table.userId),
    statusIdx: index('idx_outreach_campaigns_status').on(table.status),
  }),
);

export const outreachSequenceSteps = pgTable(
  'outreach_sequence_steps',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => outreachCampaigns.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    delayDays: integer('delay_days').notNull().default(0),
    promptTemplate: text('prompt_template').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    campaignIdx: index('idx_outreach_sequence_steps_campaign').on(table.campaignId),
  }),
);

export const outreachProspects = pgTable(
  'outreach_prospects',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => outreachCampaigns.id, { onDelete: 'cascade' }),
    profileName: text('profile_name').notNull(),
    profileBio: text('profile_bio').notNull(),
    profileUrl: text('profile_url'),
    status: text('status').notNull().default('discovered'),
    replyStatus: text('reply_status').notNull().default('none'),
    currentStepNumber: integer('current_step_number').notNull().default(1),
    threadContext: text('thread_context').default('[]'),
    generatedMessage: text('generated_message'),
    lastContactedAt: timestamp('last_contacted_at', { mode: 'string' }),
    sentAt: timestamp('sent_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    campaignIdx: index('idx_outreach_prospects_campaign').on(table.campaignId),
    statusIdx: index('idx_outreach_prospects_status').on(table.status),
    replyStatusIdx: index('idx_outreach_prospects_reply').on(table.replyStatus),
  }),
);

export const outreachReplies = pgTable(
  'outreach_replies',
  {
    id: text('id').primaryKey(),
    prospectId: text('prospect_id')
      .notNull()
      .references(() => outreachProspects.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    receivedAt: timestamp('received_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => ({
    prospectIdx: index('idx_outreach_replies_prospect').on(table.prospectId),
  }),
);
