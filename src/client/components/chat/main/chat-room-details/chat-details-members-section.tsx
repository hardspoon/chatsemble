import { ChatMemberList } from "@client/components/chat-member/chat-member-list";
import { useChatWsContext } from "@client/components/chat/providers/chat-ws-provider";

export function ChatDetailsMembersSection() {
	const {
		mainChat: { members },
	} = useChatWsContext();

	// TODO: Show or hide the add and remove member button based on the user's permissions

	return <ChatMemberList members={members} showRemoveButton={true} />;
}
