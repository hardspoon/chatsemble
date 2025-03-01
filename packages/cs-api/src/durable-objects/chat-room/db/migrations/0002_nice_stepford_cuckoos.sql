ALTER TABLE `chat_room_config` ADD `is_private` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_room_member` ADD `room_id` text NOT NULL;