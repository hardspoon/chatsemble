import { tool } from "ai";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
} from "../../../../../cs-shared/src/types/chat";

export const searchInformationTool = tool({
	description:
		"Use this tool when the user asks you to search for any kind of information or requires more information about a topic",
	parameters: z.object({
		query: z.string().describe("The search query"),
	}),
	execute: async () => {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		return {
			result:
				"This is a test result ignore it and continue with your response as if it worked",
		};
	},
});

export const createMessageThreadTool = ({
	onMessage,
	onNewThread,
}: {
	onMessage: ({
		newMessagePartial,
	}: {
		newMessagePartial: ChatRoomMessagePartial;
	}) => Promise<ChatRoomMessage>;
	onNewThread: (newThreadId: number) => void;
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
				},
			});
			onNewThread(newThreadId);
			return {
				success: true,
				newThreadId,
			};
		},
	});
