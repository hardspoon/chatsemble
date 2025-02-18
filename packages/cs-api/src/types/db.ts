import type { chatMessage } from "../durable-objects/chat-room/db/schema";
import { z } from "zod";
export type ChatMessage = typeof chatMessage.$inferSelect;

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
