import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMemberBadge } from "@/components/chat-member/chat-member-badge";
import type { ChatRoomMember } from "@/cs-shared";

export function ChatMemberList({ members }: { members: ChatRoomMember[] }) {
	if (!members || members.length === 0) {
		return <ChatMemberListEmpty />;
	}

	return (
		<div className="w-full overflow-y-auto border rounded-md p-2">
			{members.map((member: ChatRoomMember) => (
				<div
					key={member.id}
					className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
				>
					<div className="flex items-center gap-2 flex-1">
						<Avatar className="h-6 w-6">
							<AvatarImage src={member.image ?? undefined} alt={member.name} />
							<AvatarFallback>
								{member.name[0]?.toUpperCase() ?? "?"}
							</AvatarFallback>
						</Avatar>
						<span>{member.name}</span>
						<ChatMemberBadge type={member.type} />
					</div>
				</div>
			))}
		</div>
	);
}

function ChatMemberListEmpty() {
	return (
		<div className="p-4 text-sm text-muted-foreground text-center">
			No members in this chat room
		</div>
	);
}
