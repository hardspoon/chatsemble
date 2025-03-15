import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { agentChatRoomQueue } from "../schema";
import type { AgentChatRoomQueueItem } from "../../types";

export function createAgentChatRoomQueueService(db: DrizzleSqliteDODatabase) {
	return {
		async getChatRoomQueueItem(
			chatRoomId: string,
			threadId: number | null,
		): Promise<AgentChatRoomQueueItem | undefined> {
			const queueItemId = getChatRoomQueueItemId(chatRoomId, threadId);
			return db
				.select()
				.from(agentChatRoomQueue)
				.where(eq(agentChatRoomQueue.id, queueItemId))
				.get();
		},

		async createOrUpdateChatRoomQueueItem({
			chatRoomId,
			threadId,
			processAt,
		}: { chatRoomId: string; threadId: number | null; processAt: number }) {
			const queueItemId = getChatRoomQueueItemId(chatRoomId, threadId);
			await db
				.insert(agentChatRoomQueue)
				.values({
					id: queueItemId,
					roomId: chatRoomId,
					threadId: threadId,
					processAt: processAt,
				})
				.onConflictDoUpdate({
					target: [agentChatRoomQueue.id],
					set: { processAt: processAt },
				});
		},

		async getChatRoomQueueItemsToProcess(
			currentTime: number,
		): Promise<AgentChatRoomQueueItem[]> {
			return db
				.select()
				.from(agentChatRoomQueue)
				.where(
					and(
						lte(agentChatRoomQueue.processAt, currentTime),
						isNotNull(agentChatRoomQueue.processAt),
					),
				)
				.all();
		},

		async getChatRoomQueueMinProcessAt() {
			return db
				.select({
					minProcessAt: sql<number>`MIN(${agentChatRoomQueue.processAt})`,
				})
				.from(agentChatRoomQueue)
				.where(isNotNull(agentChatRoomQueue.processAt))
				.get();
		},

		async clearChatRoomQueueProcessAt(queueItemId: string) {
			await db
				.update(agentChatRoomQueue)
				.set({ processAt: null })
				.where(eq(agentChatRoomQueue.id, queueItemId));
		},

		async updateChatRoomQueueLastProcessedId(
			queueItemId: string,
			lastProcessedId: number,
		) {
			await db
				.update(agentChatRoomQueue)
				.set({ lastProcessedId: lastProcessedId })
				.where(eq(agentChatRoomQueue.id, queueItemId));
		},
	};
}

function getChatRoomQueueItemId(
	chatRoomId: string,
	threadId: number | null,
): string {
	return threadId === null ? `${chatRoomId}:` : `${chatRoomId}:${threadId}`;
}
