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
	WsMessageChatRoomMessageSend,
} from "@shared/types";
import type { User } from "better-auth";
import { useCallback, useEffect, useState } from "react";
import type { UseWebSocketConnectionStatus } from "../use-web-socket";

export function useMainChatRoomState({
	roomId,
	user,
	sendMessage,
	connectionStatus,
}: {
	roomId: string | undefined;
	user: User;
	sendMessage: (message: WsChatIncomingMessage) => void;
	connectionStatus: UseWebSocketConnectionStatus;
}) {
	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const [members, setMembers] = useState<ChatRoomMember[]>([]);
	const [room, setRoom] = useState<ChatRoom | null>(null);
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);

	useEffect(() => {
		if (connectionStatus === "connected" && roomId) {
			sendMessage({
				type: "chat-room-init-request",
				roomId,
			});
		}
	}, [connectionStatus, sendMessage, roomId]);

	const handleMessage = useCallback(
		(wsMessage: WsChatOutgoingMessage) => {
			switch (wsMessage.type) {
				case "chat-room-init-response":
					if (wsMessage.roomId === roomId) {
						setMessages(wsMessage.messages);
						setMembers(wsMessage.members);
						setRoom(wsMessage.room);
						setWorkflows(wsMessage.workflows);
						setStatus("success");
					}
					break;
				case "chat-room-message-broadcast":
					if (
						wsMessage.message.roomId === roomId && // TODO: Check if this is correct
						wsMessage.message.threadId === null
					) {
						setMessages((prev) =>
							updateMessageList({
								messages: prev,
								newMessage: wsMessage.message,
							}),
						);
					}
					break;

				/* case "member-update":
				setMembers(wsMessage.members);
				break;
			case "workflow-update":
				setWorkflows(wsMessage.workflows);
				break; */
			}
		},
		[roomId],
	);

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

			const wsMessage: WsMessageChatRoomMessageSend = {
				type: "chat-room-message-send",
				roomId,
				threadId: null,
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
			setStatus("loading");
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
