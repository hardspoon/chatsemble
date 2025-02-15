CREATE TABLE `chat_room_members` (
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_active` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_room_settings` (
	`is_archived` integer DEFAULT false NOT NULL,
	`max_history` integer DEFAULT 100
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chat_messages_table` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`member_user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_chat_messages_table`("id", "message", "member_user_id", "created_at") SELECT "id", "message", "member_user_id", "created_at" FROM `chat_messages_table`;--> statement-breakpoint
DROP TABLE `chat_messages_table`;--> statement-breakpoint
ALTER TABLE `__new_chat_messages_table` RENAME TO `chat_messages_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;