CREATE TABLE `agent` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`image` text NOT NULL,
	`description` text NOT NULL,
	`tone` text NOT NULL,
	`verbosity` text NOT NULL,
	`emoji_usage` text NOT NULL,
	`language_style` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_email_unique` ON `agent` (`email`);