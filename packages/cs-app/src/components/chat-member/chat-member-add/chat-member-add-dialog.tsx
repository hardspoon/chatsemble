import { ChatMemberAddForm } from "@/components/chat-member/chat-member-add/chat-member-add-form";
import { useChatWsContext } from "@/components/chat/chat-main/chat-ws-provider";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus } from "lucide-react";

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
	const { room } = useChatWsContext();

	if (!room) {
		return null;
	}

	return <ChatMemberAddForm roomId={room.id} onSuccess={onSuccess} />;
}
