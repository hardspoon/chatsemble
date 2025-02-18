import { useState } from "react";
import { Users } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChatWsContext } from "@/components/chat/chat-ws-provider";
import { ChatMembersList } from "@/components/chat/chat-members/chat-members-list";
import { AddMemberForm } from "@/components/chat/chat-members/add-member-form";

type DialogView = "members" | "add";

interface ChatMembersDialogProps {
	roomId: string;
}

export function ChatMembersDialog({ roomId }: ChatMembersDialogProps) {
	const [open, setOpen] = useState(false);
	const { members } = useChatWsContext();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-2">
					<Users className="h-4 w-4" />
					<span>{members.length} Members</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<ChatMembersDialogContent roomId={roomId} />
			</DialogContent>
		</Dialog>
	);
}

function ChatMembersDialogContent({ roomId }: ChatMembersDialogProps) {
	const { members } = useChatWsContext();
	const [view, setView] = useState<DialogView>("members");

	if (view === "members") {
		return (
			<ChatMembersList members={members} onAddMember={() => setView("add")} />
		);
	}

	return (
		<AddMemberForm
			roomId={roomId}
			onBack={() => setView("members")}
			onSuccess={() => setView("members")}
		/>
	);
}
