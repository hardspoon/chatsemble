import type { chatMessagesTable } from "../db/schema";

export type ChatMessage = typeof chatMessagesTable.$inferSelect;
