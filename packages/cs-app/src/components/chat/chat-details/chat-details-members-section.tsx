import { useChatWsContext } from "@/components/chat/chat-main/chat-ws-provider";
import { ChatMemberList } from "@/components/chat-member/chat-member-list";

export function ChatDetailsMembersSection() {
	const { members } = useChatWsContext();

	// TODO: Show or hide the add and remove member button based on the user's permissions

	return <ChatMemberList members={members} showRemoveButton={true} />;
}
