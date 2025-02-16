PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_agent_config` (
	`id` text PRIMARY KEY DEFAULT 'IT8TXFZeaC0Pjt7UUTgv2' NOT NULL,
	`name` text NOT NULL,
	`image` text NOT NULL,
	`system_prompt` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_agent_config`("id", "name", "image", "system_prompt", "organization_id", "created_at") SELECT "id", "name", "image", "system_prompt", "organization_id", "created_at" FROM `agent_config`;--> statement-breakpoint
DROP TABLE `agent_config`;--> statement-breakpoint
ALTER TABLE `__new_agent_config` RENAME TO `agent_config`;--> statement-breakpoint
PRAGMA foreign_keys=ON;