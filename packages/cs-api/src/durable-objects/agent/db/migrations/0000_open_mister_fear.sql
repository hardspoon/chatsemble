CREATE TABLE `agent_config` (
	`id` text PRIMARY KEY DEFAULT 'OPiXuyA6wFUiw2aPJYty7' NOT NULL,
	`name` text NOT NULL,
	`image` text NOT NULL,
	`system_prompt` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
