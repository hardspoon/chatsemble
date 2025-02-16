import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useChatWsContext } from "./chat-ws-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AddMemberDialog } from "./add-member-dialog";

interface ChatMembersDialogProps {
	roomId: string;
}

export function ChatMembersDialog({ roomId }: ChatMembersDialogProps) {
	const { members } = useChatWsContext();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-2">
					<Users className="h-4 w-4" />
					<span>{members.length} Members</span>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>Chat Members</DialogTitle>
						<AddMemberDialog roomId={roomId} />
					</div>
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
									<p className="text-sm text-muted-foreground">
										{member.email}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
