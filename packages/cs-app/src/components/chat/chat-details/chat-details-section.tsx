import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { useChatWsContext } from "../chat-main/chat-ws-provider";
import type { ChatRoomType } from "@/cs-shared";

function ChatTypeLabel({ type }: { type: ChatRoomType }) {
	const labels: Record<
		ChatRoomType,
		{ label: string; variant: "default" | "secondary" | "outline" }
	> = {
		publicGroup: { label: "Public Group", variant: "default" },
		privateGroup: { label: "Private Group", variant: "secondary" },
		oneToOne: { label: "Direct Message", variant: "outline" },
	};

	const { label, variant } = labels[type];

	return <Badge variant={variant}>{label}</Badge>;
}

function ChatDetailsSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-6 w-3/4" />
			<Skeleton className="h-4 w-1/2" />
			<Skeleton className="h-4 w-1/3" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	);
}

function ChatDetailsSectionEmpty() {
	return (
		<div className="p-4 text-sm text-muted-foreground text-center">
			No chat details available
		</div>
	);
}

export function ChatDetailsSection() {
	const { room, connectionStatus } = useChatWsContext();

	if (connectionStatus !== "ready") {
		return <ChatDetailsSkeleton />;
	}

	if (!room) {
		return <ChatDetailsSectionEmpty />;
	}

	// TODO: Add a way to edit the channel details or delete the channel

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold">{room.name}</h3>
				<div className="flex items-center gap-2 mt-1">
					<ChatTypeLabel type={room.type} />
				</div>
			</div>

			<div className="space-y-2 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<CalendarIcon className="h-4 w-4" />
					<span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	);
}
