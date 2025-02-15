import type { chatMessagesTable } from "../durable-objects/chat-room/db/schema";
import { z } from "zod";
export type ChatMessage = typeof chatMessagesTable.$inferSelect;

export const chatMessageSchema = z.object({
	id: z.string(),
	message: z.string(),
	userId: z.string(),
	userName: z.string(),
	createdAt: z.string(),
});

export const insertChatMessageSchema = chatMessageSchema.omit({
	id: true,
	createdAt: true,
});
