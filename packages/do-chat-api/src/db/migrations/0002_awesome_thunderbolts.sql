PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chat_room_members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_active` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_chat_room_members`("user_id", "role", "joined_at", "last_active") SELECT "user_id", "role", "joined_at", "last_active" FROM `chat_room_members`;--> statement-breakpoint
DROP TABLE `chat_room_members`;--> statement-breakpoint
ALTER TABLE `__new_chat_room_members` RENAME TO `chat_room_members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_chat_room_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`max_history` integer DEFAULT 100
);
--> statement-breakpoint
INSERT INTO `__new_chat_room_settings`("id", "is_archived", "max_history") SELECT "id", "is_archived", "max_history" FROM `chat_room_settings`;--> statement-breakpoint
DROP TABLE `chat_room_settings`;--> statement-breakpoint
ALTER TABLE `__new_chat_room_settings` RENAME TO `chat_room_settings`;