PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chat_message` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`mentions` text NOT NULL,
	`tool_uses` text NOT NULL,
	`member_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`metadata` text NOT NULL,
	`thread_metadata` text,
	`thread_id` integer,
	FOREIGN KEY (`member_id`) REFERENCES `chat_room_member`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_chat_message`("id", "content", "mentions", "tool_uses", "member_id", "created_at", "metadata", "thread_metadata", "thread_id") SELECT "id", "content", "mentions", "tool_uses", "member_id", "created_at", "metadata", "thread_metadata", "thread_id" FROM `chat_message`;--> statement-breakpoint
DROP TABLE `chat_message`;--> statement-breakpoint
ALTER TABLE `__new_chat_message` RENAME TO `chat_message`;--> statement-breakpoint
PRAGMA foreign_keys=ON;