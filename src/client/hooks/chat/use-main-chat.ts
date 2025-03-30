import { updateMessageList } from "@/lib/chat";
import type {
	ChatInputValue,
	ChatRoom,
	ChatRoomMember,
	ChatRoomMessage,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageSend,
} from "@/shared/types";
import type { User } from "better-auth";
import { useCallback, useEffect, useState } from "react";
import {
	createChatRoomMessagePartial,
	createChatRoomOptimisticMessage,
} from "../../../shared/lib/chat";
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
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");

	useEffect(() => {
		if (connectionStatus === "connected") {
			sendMessage({ type: "chat-init-request" });
		}
	}, [connectionStatus, sendMessage]);

	const handleMessage = useCallback((wsMessage: WsChatOutgoingMessage) => {
		console.log(
			"[useMainChat] handleMessage",
			JSON.parse(JSON.stringify(wsMessage)),
		);
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
				setStatus("success");
				break;
			case "member-update":
				setMembers(wsMessage.members);
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
			setStatus("idle");
		}
	}, [roomId]);

	return {
		messages,
		members,
		room,
		status,
		handleSubmit,
		handleMessage,
	};
}
