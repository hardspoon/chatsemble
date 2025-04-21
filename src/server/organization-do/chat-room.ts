import type { Session } from "@server/types/session";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@shared/types";
import type { ChatRoomDbServices } from "./db/services";
import type { OrganizationDurableObject } from "./organization";

export class ChatRooms {
	private organizationDO: OrganizationDurableObject;

	constructor(organizationDO: OrganizationDurableObject) {
		this.organizationDO = organizationDO;
	}

	async handleChatRoomInitRequest(
		webSocket: WebSocket,
		session: Session,
		roomId: string,
	) {
		const isMember = await this.organizationDO.dbServices.isUserMemberOfRoom({
			roomId,
			userId: session.userId,
		});

		if (!isMember) {
			console.warn(
				`User ${session.userId} attempted to access room ${roomId} but is not a member.`,
			);
			if (session.activeRoomId !== null) {
				const newSession = { ...session, activeRoomId: null };
				webSocket.serializeAttachment(newSession);
				this.organizationDO.sessions.set(webSocket, newSession);
			}
			return;
		}

		const [room, members, messages, workflows] = await Promise.all([
			this.organizationDO.dbServices.getChatRoomById(roomId),
			this.organizationDO.dbServices.getChatRoomMembers({ roomId }),
			this.organizationDO.dbServices.getChatRoomMessages({
				roomId,
				threadId: null,
			}),
			this.organizationDO.dbServices.getChatRoomWorkflows(roomId),
		]);

		if (!room) {
			console.error("Room not found");
			throw new Error("Room not found");
		}

		const newSession = { ...session, activeRoomId: roomId };

		webSocket.serializeAttachment(newSession);
		this.organizationDO.sessions.set(webSocket, newSession);

		this.organizationDO.sendWebSocketMessageToUser(
			{
				type: "chat-room-init-response",
				roomId,
				messages,
				members,
				room,
				workflows,
			},
			session.userId,
		);
	}

	async handleChatRoomThreadInitRequest(
		webSocket: WebSocket,
		session: Session,
		roomId: string,
		threadId: number,
	) {
		const isMember = await this.organizationDO.dbServices.isUserMemberOfRoom({
			roomId,
			userId: session.userId,
		});

		if (!isMember) {
			console.warn(
				`User ${session.userId} attempted to access room ${roomId} but is not a member.`,
			);
			if (session.activeRoomId !== null) {
				const newSession = { ...session, activeRoomId: null };
				webSocket.serializeAttachment(newSession);
				this.organizationDO.sessions.set(webSocket, newSession);
			}
			return; // Stop processing
		}

		if (session.activeRoomId !== roomId) {
			const newSession = { ...session, activeRoomId: roomId };

			webSocket.serializeAttachment(newSession);
			this.organizationDO.sessions.set(webSocket, newSession);
		}

		const [threadMessage, messages] = await Promise.all([
			this.organizationDO.dbServices.getChatRoomMessageById(threadId),
			this.organizationDO.dbServices.getChatRoomMessages({
				roomId,
				threadId,
			}),
		]);

		if (!threadMessage) {
			console.error("Thread message not found");
			throw new Error("Thread message not found");
		}

		this.organizationDO.sendWebSocketMessageToUser(
			{
				type: "chat-room-thread-init-response",
				roomId,
				threadId,
				threadMessage,
				messages,
			},
			session.userId,
		);
	}

	async receiveChatRoomMessage({
		memberId,
		roomId,
		message,
		existingMessageId,
		notifyAgents,
	}: {
		memberId: string;
		roomId: string;
		message: ChatRoomMessagePartial;
		existingMessageId: number | null;
		notifyAgents: boolean;
	}): Promise<ChatRoomMessage> {
		let chatRoomMessage: ChatRoomMessage;

		if (existingMessageId) {
			chatRoomMessage =
				await this.organizationDO.dbServices.updateChatRoomMessage(
					existingMessageId,
					{
						content: message.content,
						mentions: message.mentions,
						toolUses: message.toolUses,
					},
				);
		} else {
			chatRoomMessage =
				await this.organizationDO.dbServices.insertChatRoomMessage({
					memberId,
					content: message.content,
					mentions: message.mentions,
					toolUses: message.toolUses,
					threadId: message.threadId,
					roomId,
					metadata: {
						optimisticData: {
							createdAt: message.createdAt,
							id: message.id,
						},
					},
					threadMetadata: null,
				});

			if (message.threadId) {
				const updatedThreadMessage =
					await this.organizationDO.dbServices.updateChatRoomMessageThreadMetadata(
						message.threadId,
						chatRoomMessage,
					);

				this.organizationDO.broadcastWebSocketMessageToRoom(
					{
						type: "chat-room-message-broadcast",
						roomId,
						threadId: updatedThreadMessage.threadId,
						message: updatedThreadMessage,
					},
					roomId,
				);
			}
		}

		this.organizationDO.broadcastWebSocketMessageToRoom(
			{
				type: "chat-room-message-broadcast",
				roomId,
				threadId: chatRoomMessage.threadId,
				message: chatRoomMessage,
			},
			roomId,
		);

		if (notifyAgents && !existingMessageId) {
			await this.organizationDO.agents.routeMessagesAndNotifyAgents(
				chatRoomMessage,
			);
		}

		return chatRoomMessage;
	}

	private async sendChatRoomsUpdateToUsers(userIds: string[]) {
		const chatRoomsPromises = userIds.map((userId) =>
			this.organizationDO.dbServices.getChatRoomsUserIsMemberOf(userId),
		);
		const chatRoomsResults = await Promise.all(chatRoomsPromises);

		userIds.forEach((userId, index) => {
			this.organizationDO.sendWebSocketMessageToUser(
				{
					type: "chat-rooms-update",
					chatRooms: chatRoomsResults[index],
				},
				userId,
			);
		});
	}

	private async broadcastChatRoomMembersUpdate(chatRoomId: string) {
		const members = await this.organizationDO.dbServices.getChatRoomMembers({
			roomId: chatRoomId,
		});

		this.organizationDO.broadcastWebSocketMessageToRoom(
			{
				type: "chat-room-members-update",
				roomId: chatRoomId,
				members,
			},
			chatRoomId,
		);
	}

	// Chat room services

	async createChatRoom(
		newChatRoom: Parameters<ChatRoomDbServices["createChatRoom"]>[0],
	) {
		const createdChatRoom =
			await this.organizationDO.dbServices.createChatRoom(newChatRoom);

		const membersIds = newChatRoom.members
			.filter((member) => member.type === "user")
			.map((member) => member.id);

		this.sendChatRoomsUpdateToUsers(membersIds);

		return createdChatRoom;
	}

	// Chat room member services

	async deleteChatRoomMember(
		deleteChatRoomMemberParams: Parameters<
			ChatRoomDbServices["deleteChatRoomMember"]
		>[0],
	) {
		const deletedChatRoomMember =
			await this.organizationDO.dbServices.deleteChatRoomMember(
				deleteChatRoomMemberParams,
			);

		this.sendChatRoomsUpdateToUsers([deleteChatRoomMemberParams.memberId]);

		this.broadcastChatRoomMembersUpdate(deleteChatRoomMemberParams.roomId);

		return deletedChatRoomMember;
	}

	async addChatRoomMember(
		addChatRoomMemberParams: Parameters<
			ChatRoomDbServices["addChatRoomMember"]
		>[0],
	) {
		const addedChatRoomMember =
			await this.organizationDO.dbServices.addChatRoomMember(
				addChatRoomMemberParams,
			);

		this.sendChatRoomsUpdateToUsers([addChatRoomMemberParams.id]);

		this.broadcastChatRoomMembersUpdate(addChatRoomMemberParams.roomId);

		return addedChatRoomMember;
	}
}
