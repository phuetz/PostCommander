CREATE TABLE "auto_blog_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"topic" text NOT NULL,
	"article_type" text DEFAULT 'fond-technique' NOT NULL,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"provider" text DEFAULT 'openai' NOT NULL,
	"model" text DEFAULT 'gpt-4o' NOT NULL,
	"author_name" text,
	"author_role" text,
	"author_references" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_ideas" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text,
	"pillar_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'idea' NOT NULL,
	"post_id" text,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pillars" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6',
	"topics" text,
	"posting_frequency" text DEFAULT 'weekly',
	"target_platforms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deleted_account_audits" (
	"id" text PRIMARY KEY NOT NULL,
	"original_user_id" text NOT NULL,
	"email_hash" text NOT NULL,
	"stripe_customer_id" text,
	"plan" text NOT NULL,
	"plan_status" text NOT NULL,
	"user_created_at" timestamp,
	"deleted_at" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'self_service' NOT NULL,
	"snapshot" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deleted_billing_records" (
	"id" text PRIMARY KEY NOT NULL,
	"deleted_account_audit_id" text NOT NULL,
	"record_type" text NOT NULL,
	"stripe_record_id" text NOT NULL,
	"status" text NOT NULL,
	"snapshot" text NOT NULL,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_images" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"post_id" text,
	"prompt" text NOT NULL,
	"provider" text NOT NULL,
	"image_url" text,
	"image_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_invoice_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"status" text NOT NULL,
	"invoice_url" text,
	"invoice_pdf" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "outreach_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"target_keywords" text NOT NULL,
	"target_activity" text,
	"campaign_goal" text NOT NULL,
	"platform" text NOT NULL,
	"daily_limit" integer DEFAULT 15 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_prospects" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"profile_name" text NOT NULL,
	"profile_bio" text NOT NULL,
	"profile_url" text,
	"status" text DEFAULT 'discovered' NOT NULL,
	"reply_status" text DEFAULT 'none' NOT NULL,
	"current_step_number" integer DEFAULT 1 NOT NULL,
	"thread_context" text DEFAULT '[]',
	"generated_message" text,
	"last_contacted_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"prospect_id" text NOT NULL,
	"content" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_sequence_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"step_number" integer NOT NULL,
	"delay_days" integer DEFAULT 0 NOT NULL,
	"prompt_template" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "platform_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text,
	"platform" text NOT NULL,
	"account_name" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires" timestamp,
	"scopes" text,
	"metadata" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"platform" text NOT NULL,
	"connection_id" text,
	"platform_post_id" text,
	"platform_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"has_auto_plugged" boolean DEFAULT false,
	"last_synced_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text,
	"content" text NOT NULL,
	"original_prompt" text,
	"tone" text,
	"original_post_id" text,
	"llm_provider" text,
	"llm_model" text,
	"platforms" text NOT NULL,
	"platform_variants" text,
	"hashtags" text,
	"auto_plug_content" text,
	"auto_plug_threshold" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_publication_id" text NOT NULL,
	"platform_comment_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_handle" text,
	"author_avatar_url" text,
	"content" text NOT NULL,
	"is_replied" boolean DEFAULT false,
	"reply_content" text,
	"lead_score" integer,
	"lead_status" text DEFAULT 'unscored',
	"lead_reason" text,
	"agent_state" text,
	"requires_human" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"plan" text NOT NULL,
	"interval" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"platform" text,
	"tone" text,
	"prompt_template" text NOT NULL,
	"example_output" text,
	"uses_count" integer DEFAULT 0,
	"language" text DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text,
	"avatar_url" text,
	"role" text DEFAULT 'user' NOT NULL,
	"stripe_customer_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"plan_status" text DEFAULT 'active' NOT NULL,
	"posts_used_this_month" integer DEFAULT 0,
	"posts_reset_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "viral_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" text NOT NULL,
	"content" text NOT NULL,
	"author_name" text,
	"author_handle" text,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"category" text,
	"tags" text,
	"language" text DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_styles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"workspace_id" text,
	"name" text NOT NULL,
	"description" text,
	"sample_posts" text NOT NULL,
	"analyzed_style" text,
	"llm_system_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auto_blog_configs" ADD CONSTRAINT "auto_blog_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_blog_configs" ADD CONSTRAINT "auto_blog_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_pillar_id_content_pillars_id_fk" FOREIGN KEY ("pillar_id") REFERENCES "public"."content_pillars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pillars" ADD CONSTRAINT "content_pillars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_pillars" ADD CONSTRAINT "content_pillars_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deleted_billing_records" ADD CONSTRAINT "deleted_billing_records_deleted_account_audit_id_deleted_account_audits_id_fk" FOREIGN KEY ("deleted_account_audit_id") REFERENCES "public"."deleted_account_audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_images" ADD CONSTRAINT "generated_images_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_prospects" ADD CONSTRAINT "outreach_prospects_campaign_id_outreach_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."outreach_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_replies" ADD CONSTRAINT "outreach_replies_prospect_id_outreach_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."outreach_prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_sequence_steps" ADD CONSTRAINT "outreach_sequence_steps_campaign_id_outreach_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."outreach_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_approvals" ADD CONSTRAINT "post_approvals_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_approvals" ADD CONSTRAINT "post_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_connection_id_platform_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."platform_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_post_publication_id_post_publications_id_fk" FOREIGN KEY ("post_publication_id") REFERENCES "public"."post_publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_styles" ADD CONSTRAINT "writing_styles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_styles" ADD CONSTRAINT "writing_styles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_auto_blog_configs_user" ON "auto_blog_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auto_blog_configs_status" ON "auto_blog_configs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_content_ideas_user" ON "content_ideas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_content_pillars_user" ON "content_pillars" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deleted_account_audits_original_user" ON "deleted_account_audits" USING btree ("original_user_id");--> statement-breakpoint
CREATE INDEX "idx_deleted_account_audits_deleted_at" ON "deleted_account_audits" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_deleted_account_audits_email_hash" ON "deleted_account_audits" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "idx_deleted_billing_records_audit" ON "deleted_billing_records" USING btree ("deleted_account_audit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deleted_billing_records_record" ON "deleted_billing_records" USING btree ("deleted_account_audit_id","record_type","stripe_record_id");--> statement-breakpoint
CREATE INDEX "idx_generated_images_user" ON "generated_images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_campaigns_user" ON "outreach_campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_campaigns_status" ON "outreach_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_outreach_prospects_campaign" ON "outreach_prospects" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_prospects_status" ON "outreach_prospects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_outreach_prospects_reply" ON "outreach_prospects" USING btree ("reply_status");--> statement-breakpoint
CREATE INDEX "idx_outreach_replies_prospect" ON "outreach_replies" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_sequence_steps_campaign" ON "outreach_sequence_steps" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_platform_connections_user" ON "platform_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_platform_connections_user_platform" ON "platform_connections" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "idx_post_approvals_post_id" ON "post_approvals" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_comments_post_id" ON "post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_comments_user_id" ON "post_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_posts_user" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_settings_user" ON "settings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_settings_user_key" ON "settings" USING btree ("user_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_workspace_members_user" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_writing_styles_user" ON "writing_styles" USING btree ("user_id");