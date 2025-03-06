import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberBadge } from "@/components/members/member-badge";
import type { ChatRoomMember } from "@/cs-shared";
import { useChatWsContext } from "../chat-ws-provider";

function ChatDetailsDialogMembersSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

export function ChatMembers() {
	const { members, connectionStatus } = useChatWsContext();

	if (connectionStatus !== "ready") {
		return <ChatDetailsDialogMembersSkeleton />;
	}

	if (!members || members.length === 0) {
		return <ChatDetailsDialogMembersEmpty />;
	}

	return (
		<div className="max-h-60 overflow-y-auto border rounded-md p-2">
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
						<MemberBadge type={member.type} />
					</div>
				</div>
			))}
		</div>
	);
}

function ChatDetailsDialogMembersEmpty() {
	return (
		<div className="p-4 text-sm text-muted-foreground text-center">
			No members in this chat room
		</div>
	);
}
