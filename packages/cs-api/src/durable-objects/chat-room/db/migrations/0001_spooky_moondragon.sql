CREATE TABLE `chat_room_config` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `chat_room_member` ADD `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL;