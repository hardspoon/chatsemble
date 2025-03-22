import type {
	AgentToolUse,
	ChatRoomMessage,
	ChatRoomMessagePartial,
} from "@/cs-shared";
import type { CoreMessage, TextStreamPart } from "ai";
import { customAlphabet } from "nanoid";
import type { AgentMessage } from "../../durable-objects/agent/types";

export function chatRoomMessagesToAgentMessages(
	messages: ChatRoomMessage[],
): AgentMessage[] {
	const aiMessages: AgentMessage[] = messages.map((msg) => {
		return {
			content: msg.content,
			toolUses: msg.toolUses,
			member: {
				id: msg.member.id,
				name: msg.member.name,
				type: msg.member.type,
			},
		};
	});

	return aiMessages;
}

export function agentMessagesToContextCoreMessages(
	contextMessages: ChatRoomMessage[],
	newMessages: ChatRoomMessage[],
): CoreMessage[] {
	const agentMessagesContext = chatRoomMessagesToAgentMessages(contextMessages);
	const agentMessagesNew = chatRoomMessagesToAgentMessages(newMessages);
	return [
		{
			role: "system",
			content: `
			<conversation_history_context>
			${JSON.stringify(agentMessagesContext)}
			</conversation_history_context>
			`,
		},
		{
			role: "user",
			content: `
			<new_messages_to_process>
			${JSON.stringify(agentMessagesNew)}
			</new_messages_to_process>
			`,
		},
	];
}

export function createChatRoomMessagePartial({
	content,
	toolUses,
	threadId,
}: {
	content: string;
	toolUses: AgentToolUse[];
	threadId: number | null;
}): ChatRoomMessagePartial {
	return {
		id: Number(customAlphabet("0123456789", 20)()),
		threadId,
		content,
		toolUses,
		mentions: [],
		createdAt: Date.now(),
	};
}

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

export async function processStream({
	fullStream,
	getThreadId,
	omitSendingTool,
	onMessageSend,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	fullStream: AsyncIterableStream<TextStreamPart<any>>;
	getThreadId: () => number | null;
	omitSendingTool: string[];
	onMessageSend: ({
		newMessagePartial,
		existingMessageId,
	}: {
		newMessagePartial: ChatRoomMessagePartial;
		existingMessageId?: number | null;
	}) => Promise<ChatRoomMessage>;
}) {
	const streamedMessages: Omit<ChatRoomMessage, "member">[] = [];

	for await (const chunk of fullStream) {
		const currentThreadId = getThreadId();
		console.log("[processStream] currentThreadId", currentThreadId);
		switch (chunk.type) {
			case "step-start": {
				console.log(
					"[processStream] Starting new step",
					JSON.parse(JSON.stringify(chunk)),
				);
				const newPartialMessage = createChatRoomMessagePartial({
					content: "",
					toolUses: [],
					threadId: currentThreadId,
				});
				streamedMessages.push({
					...newPartialMessage,
					threadMetadata: null,
					metadata: {
						optimisticData: {
							id: newPartialMessage.id,
							createdAt: newPartialMessage.createdAt,
						},
					},
				});
				break;
			}
			case "text-delta":
			case "tool-call":
			case "tool-result": {
				console.log("[processStream] Chunk", JSON.parse(JSON.stringify(chunk)));
				if (
					(chunk.type === "tool-call" || chunk.type === "tool-result") &&
					omitSendingTool.includes(chunk.toolName)
				) {
					break;
				}
				const currentMessage = streamedMessages[streamedMessages.length - 1];
				if (!currentMessage) {
					throw new Error("No current message found");
				}

				const haventSentCurrentMessage =
					currentMessage.id === currentMessage.metadata.optimisticData?.id;

				let newContent = currentMessage.content;

				if (chunk.type === "text-delta") {
					newContent += chunk.textDelta;
				}

				const newToolUses = [...currentMessage.toolUses];
				if (chunk.type === "tool-call" || chunk.type === "tool-result") {
					const toolIsAlreadyInMessageIndex = currentMessage.toolUses.findIndex(
						(toolUse) => toolUse.toolCallId === chunk.toolCallId,
					);

					if (toolIsAlreadyInMessageIndex === -1) {
						newToolUses.push(chunk);
					} else {
						newToolUses[toolIsAlreadyInMessageIndex] = chunk;
					}
				}

				const newMessage = await onMessageSend({
					newMessagePartial: {
						id: currentMessage.id,
						mentions: currentMessage.mentions,
						content: newContent,
						toolUses: newToolUses,
						threadId: currentThreadId,
						createdAt: currentMessage.createdAt,
					},
					existingMessageId: haventSentCurrentMessage
						? null
						: currentMessage.id,
				});

				streamedMessages[streamedMessages.length - 1] = newMessage;

				break;
			}
			case "step-finish": {
				console.log("[processStream] Step finished");
				break;
			}
			case "finish": {
				console.log("[processStream] Stream finished", streamedMessages);
				break;
			}
			case "error": {
				console.error("[processStream] Stream error", chunk.error);
				break;
			}
		}
	}

	return streamedMessages;
}
