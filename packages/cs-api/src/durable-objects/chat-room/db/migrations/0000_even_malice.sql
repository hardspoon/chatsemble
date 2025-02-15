CREATE TABLE `chat_messages_table` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `chat_room_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_room_members` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_room_members_email_unique` ON `chat_room_members` (`email`);