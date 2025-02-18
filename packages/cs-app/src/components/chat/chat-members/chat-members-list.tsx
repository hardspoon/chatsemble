import { Plus } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ChatRoomMember } from "@/cs-shared";

interface ChatMembersListProps {
	members: ChatRoomMember[];
	onAddMember: () => void;
}

export function ChatMembersList({
	members,
	onAddMember,
}: ChatMembersListProps) {
	return (
		<>
			<DialogHeader className="flex flex-row items-center justify-start gap-4">
				<DialogTitle>Chat Members</DialogTitle>
				<Button variant="outline" size="sm" onClick={onAddMember}>
					<Plus className="h-4 w-4 mr-2" />
					Add Member
				</Button>
			</DialogHeader>
			<div className="space-y-4">
				{members.map((member) => (
					<div
						key={member.id}
						className="flex items-center gap-3 rounded-lg border p-3"
					>
						<Avatar>
							<AvatarImage src={member.image ?? undefined} />
							<AvatarFallback>
								{member.name?.[0]?.toUpperCase() ?? "?"}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
								<span className="font-medium">{member.name}</span>
								<Badge
									variant={member.type === "agent" ? "default" : "secondary"}
								>
									{member.type}
								</Badge>
							</div>
							{member.email && (
								<p className="text-sm text-muted-foreground">{member.email}</p>
							)}
						</div>
					</div>
				))}
			</div>
		</>
	);
}
