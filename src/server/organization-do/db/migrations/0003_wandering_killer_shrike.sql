CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`chat_room_id` text NOT NULL,
	`goal` text NOT NULL,
	`steps` text NOT NULL,
	`schedule_expression` text NOT NULL,
	`next_execution_time` integer NOT NULL,
	`last_execution_time` integer,
	`is_active` integer NOT NULL,
	`is_recurring` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
