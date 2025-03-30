import { ChatMemberAddForm } from "@client/components/chat-member/chat-member-add/chat-member-add-form";
import { useChatWsContext } from "@client/components/chat/providers/chat-ws-provider";
import { Button } from "@client/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@client/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ChatMemberAddDialog() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" className="w-full flex justify-start gap-2">
					<Plus className="w-4 h-4" />
					Add Member
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<ChatMemberAddDialogContent onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

function ChatMemberAddDialogContent({
	onSuccess,
}: {
	onSuccess: () => void;
}) {
	const {
		mainChat: { room },
	} = useChatWsContext();

	if (!room) {
		return null;
	}

	return <ChatMemberAddForm roomId={room.id} onSuccess={onSuccess} />;
}
