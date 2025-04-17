import type { ChatRoomMessage, ChatRoomMessagePartial } from "@shared/types";
import { tool } from "ai";
import { customAlphabet } from "nanoid";
import { z } from "zod";

export const createMessageThreadTool = ({
	onMessage,
	onNewThread,
	roomId,
}: {
	onMessage: ({
		newMessagePartial,
	}: {
		newMessagePartial: ChatRoomMessagePartial;
	}) => Promise<ChatRoomMessage>;
	onNewThread: (newThreadId: number) => void;
	roomId: string;
}) =>
	tool({
		description:
			"Use this tool to create a new message thread if we are not already responding in a thread (threadId is null)",
		parameters: z.object({
			message: z.string().describe("The message to include in the thread"),
		}),
		execute: async ({ message }) => {
			const { id: newThreadId } = await onMessage({
				newMessagePartial: {
					id: Number(customAlphabet("0123456789", 20)()),
					content: message,
					mentions: [],
					toolUses: [],
					createdAt: Date.now(),
					threadId: null,
					roomId,
				},
			});
			onNewThread(newThreadId);
			return {
				success: true,
				newThreadId,
			};
		},
	});
