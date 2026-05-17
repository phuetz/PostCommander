CREATE TABLE IF NOT EXISTS `post_approvals` (
    `id` text PRIMARY KEY NOT NULL,
    `post_id` text NOT NULL,
    `user_id` text NOT NULL,
    `status` text NOT NULL,
    `feedback` text,
    `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `idx_post_approvals_post_id` ON `post_approvals` (`post_id`);

ALTER TABLE `social_comments` ADD COLUMN `is_resolved` integer DEFAULT 0;
