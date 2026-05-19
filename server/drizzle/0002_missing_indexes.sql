-- Add indexes for hot worker/query paths identified by audit dim 5 (D3) & 10 (PB2).
-- Composite indexes ordered by selectivity: (status, scheduled_at) lets the
-- publishing-scheduler scan only rows where status = 'scheduled' and seek to
-- the soonest scheduled_at.

-- posts: publishing scheduler filters by status, then scheduled_at
CREATE INDEX IF NOT EXISTS "idx_posts_status_scheduled" ON "posts" USING btree ("status", "scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_posts_workspace" ON "posts" USING btree ("workspace_id");

-- post_publications: analytics worker joins by post_id, filters by status; per-platform stats queries hit (post_id, platform)
CREATE INDEX IF NOT EXISTS "idx_post_publications_post" ON "post_publications" USING btree ("post_id");
CREATE INDEX IF NOT EXISTS "idx_post_publications_post_status" ON "post_publications" USING btree ("post_id", "status");
CREATE INDEX IF NOT EXISTS "idx_post_publications_connection" ON "post_publications" USING btree ("connection_id");

-- social_comments: inbox lookups (publication + replied flag), agent unique-by-platformCommentId
CREATE INDEX IF NOT EXISTS "idx_social_comments_publication_replied" ON "social_comments" USING btree ("post_publication_id", "is_replied");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_social_comments_platform_comment_id" ON "social_comments" USING btree ("platform_comment_id");

-- generated_images: lookup by postId (frontend gallery, publication attach)
CREATE INDEX IF NOT EXISTS "idx_generated_images_post" ON "generated_images" USING btree ("post_id");
