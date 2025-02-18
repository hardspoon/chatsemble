import type { ChatRoomMessage } from "@/cs-shared";
import type { CoreMessage } from "ai";

export function chatRoomMessagesToAiMessages(
	messages: ChatRoomMessage[],
): CoreMessage[] {
	const aiMessages: CoreMessage[] = messages.map((msg) => {
		if (msg.user.type === "agent") {
			return {
				role: "assistant",
				//content: `(assistant: ${msg.user.name}): ${msg.content}`,
				content: msg.content,
			};
		}

		return {
			role: "user",
			content: `(user: ${msg.user.name}): ${msg.content}`,
		};
	});

	return aiMessages;
}
