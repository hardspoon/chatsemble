import type { ChatRoomMessage } from "@shared/types";
import type { Message } from "ai";

function chatRoomMessageToAIMessage({
	message,
	isNew,
	agentIdForAssistant,
}: {
	message: ChatRoomMessage;
	isNew: boolean;
	agentIdForAssistant?: string;
}): Message {
	const role = agentIdForAssistant
		? message.member.id === agentIdForAssistant
			? "assistant"
			: "user"
		: message.member.type === "user"
			? "user"
			: "assistant";

	const messageMetadata = `<message-metadata member-id="${message.member.id}" member-name="${message.member.name}" member-type="${message.member.type}" is-new-message="${isNew}" />`;

	const content =
		message.content.trim().length > 0
			? `${messageMetadata}\n\n${message.content}`
			: messageMetadata;

	const partsWithContent =
		message.content.trim().length > 0
			? [
					{
						type: "text" as const,
						text: content,
					},
				]
			: [];

	const toolInvocations = message.toolUses.map((toolUse) => {
		if (toolUse.type === "tool-result") {
			return {
				type: "tool-invocation" as const,
				toolInvocation: {
					state: "result" as const,
					toolCallId: toolUse.toolCallId,
					toolName: toolUse.toolName,
					args: toolUse.args,
					result: toolUse.result,
				},
			};
		}
		return {
			type: "tool-invocation" as const,
			toolInvocation: {
				state: "call" as const,
				toolCallId: toolUse.toolCallId,
				toolName: toolUse.toolName,
				args: toolUse.args,
			},
		};
	});

	const parts = [...partsWithContent, ...toolInvocations];

	return {
		id: message.id.toString(),
		role: role,
		content,
		parts,
		createdAt: new Date(message.createdAt),
	};
}

export function contextAndNewchatRoomMessagesToAIMessages({
	contextMessages,
	newMessages,
	agentIdForAssistant,
}: {
	contextMessages: ChatRoomMessage[];
	newMessages: ChatRoomMessage[];
	agentIdForAssistant?: string;
}): Message[] {
	const contextAIMessages: Message[] = contextMessages.map((msg) =>
		chatRoomMessageToAIMessage({
			message: msg,
			isNew: false,
			agentIdForAssistant,
		}),
	);
	const newAIMessages: Message[] = newMessages.map((msg) =>
		chatRoomMessageToAIMessage({
			message: msg,
			isNew: true,
			agentIdForAssistant,
		}),
	);

	return [...contextAIMessages, ...newAIMessages];
}
