import * as chatRoom from "@server/db/services/chat-room";
import * as chatRoomMember from "@server/db/services/chat-room-member";

export const dbServices = {
	room: chatRoom,
	roomMember: chatRoomMember,
};
