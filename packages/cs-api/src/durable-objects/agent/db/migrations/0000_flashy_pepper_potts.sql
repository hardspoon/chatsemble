CREATE TABLE `agent_chat_room` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_chat_room_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`thread_id` integer,
	`last_processed_id` integer,
	`process_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_config` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image` text NOT NULL,
	`system_prompt` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
