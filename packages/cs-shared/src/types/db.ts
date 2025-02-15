import type { chatRoom } from "../db/schema";

export type ChatRoom = typeof chatRoom.$inferSelect;
