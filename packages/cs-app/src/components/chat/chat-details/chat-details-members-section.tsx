import { useChatWsContext } from "@/components/chat/chat-main/chat-ws-provider";
import { ChatMemberList } from "@/components/chat-member/chat-member-list";

import { ChatMemberAddDialog } from "@/components/chat-member/chat-member-add/chat-member-add-dialog";

export function ChatDetailsMembersSection() {
	const { members } = useChatWsContext();

	// TODO: Add a way to remove members

	return (
		<div className="flex flex-col gap-2 items-start">
			<ChatMemberAddDialog />
			<ChatMemberList members={members} />
		</div>
	);
}
