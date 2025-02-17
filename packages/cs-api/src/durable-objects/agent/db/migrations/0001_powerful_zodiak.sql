CREATE TABLE `agent_chat_room` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notifications` integer DEFAULT 0 NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
