CREATE TABLE `chat_messages_table` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
