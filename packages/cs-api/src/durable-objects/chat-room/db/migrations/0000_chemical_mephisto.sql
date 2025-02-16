CREATE TABLE `chat_messages_table` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`member_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `chat_room_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_room_members` (
	`id` text NOT NULL,
	`role` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`image` text,
	PRIMARY KEY(`id`, `role`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_room_members_email_unique` ON `chat_room_members` (`email`);