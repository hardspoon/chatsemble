import { updateMessageList } from "@client/lib/chat";
import {
	createChatRoomMessagePartial,
	createChatRoomOptimisticMessage,
} from "@shared/lib/chat";
import type {
	ChatInputValue,
	ChatRoom,
	ChatRoomMember,
	ChatRoomMessage,
	Workflow,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageSend,
} from "@shared/types";
import type { User } from "better-auth";
import { useCallback, useEffect, useState } from "react";
import type { UseWebSocketConnectionStatus } from "./use-web-socket";

export function useMainChat({
	roomId,
	user,
	sendMessage,
	connectionStatus,
}: {
	roomId: string | null;
	user: User;
	sendMessage: (message: WsChatIncomingMessage) => void;
	connectionStatus: UseWebSocketConnectionStatus;
}) {
	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const [members, setMembers] = useState<ChatRoomMember[]>([]);
	const [room, setRoom] = useState<ChatRoom | null>(null);
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	useEffect(() => {
		if (connectionStatus === "connected") {
			sendMessage({ type: "chat-init-request" });
		}
	}, [connectionStatus, sendMessage]);

	const handleMessage = useCallback((wsMessage: WsChatOutgoingMessage) => {
		switch (wsMessage.type) {
			case "message-broadcast":
				if (wsMessage.message.threadId === null) {
					setMessages((prev) =>
						updateMessageList({
							messages: prev,
							newMessage: wsMessage.message,
						}),
					);
				}
				break;
			case "chat-init-response":
				setMessages(wsMessage.messages);
				setMembers(wsMessage.members);
				setRoom(wsMessage.room);
				setWorkflows(wsMessage.workflows);
				setStatus("success");
				break;
			case "member-update":
				setMembers(wsMessage.members);
				break;
			case "workflow-update":
				setWorkflows(wsMessage.workflows);
				break;
		}
	}, []);

	const handleSubmit = useCallback(
		({ value }: { value: ChatInputValue }) => {
			if (
				!value.content.trim() ||
				!roomId ||
				connectionStatus !== "connected"
			) {
				return;
			}

			const newMessagePartial = createChatRoomMessagePartial({
				content: value.content,
				mentions: value.mentions,
				toolUses: [],
				threadId: null,
			});

			const wsMessage: WsMessageSend = {
				type: "message-send",
				message: newMessagePartial,
			};

			sendMessage(wsMessage);

			const newMessage = createChatRoomOptimisticMessage({
				message: newMessagePartial,
				user,
				roomId,
			});

			setMessages((prev) =>
				updateMessageList({
					messages: prev,
					newMessage,
					addAsNew: true,
				}),
			);
		},
		[roomId, user, connectionStatus, sendMessage],
	);

	useEffect(() => {
		if (!roomId) {
			setMessages([]);
			setMembers([]);
			setRoom(null);
			setWorkflows([]);
			setStatus("idle");
		}
	}, [roomId]);

	return {
		messages,
		members,
		room,
		workflows,
		status,
		handleSubmit,
		handleMessage,
	};
}
