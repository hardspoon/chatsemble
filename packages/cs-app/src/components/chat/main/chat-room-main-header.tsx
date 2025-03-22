import { useChatWsContext } from "@/components/chat/providers/chat-ws-provider";

import { ChatRoomHeader } from "@/components/chat/layout/chat-room-header";
import { ChatDetailsDialog } from "@/components/chat/main/chat-room-details/chat-details-dialog";
import type { ChatDetailsDialogOpen } from "@/components/chat/main/chat-room-details/chat-details-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";

export function ChatRoomMainHeader() {
	const [openChatDetailsDialog, setOpenChatDetailsDialog] =
		useState<ChatDetailsDialogOpen>(null);

	const { connectionStatus } = useChatWsContext();

	return (
		<ChatRoomHeader>
			{connectionStatus === "ready" ? (
				<>
					<ChatRoomName setOpenChatDetailsDialog={setOpenChatDetailsDialog} />
					<div className="ml-auto flex items-center gap-2">
						<ChatRoomMembers
							setOpenChatDetailsDialog={setOpenChatDetailsDialog}
						/>
						<ChatRoomConnectionStatus />
					</div>
					<ChatDetailsDialog
						open={openChatDetailsDialog}
						onOpenChange={setOpenChatDetailsDialog}
					/>
				</>
			) : (
				<>
					<Skeleton className="ml-2 h-4 w-28" />
					<Skeleton className="ml-auto h-4 w-28" />
				</>
			)}
		</ChatRoomHeader>
	);
}

function ChatRoomName({
	setOpenChatDetailsDialog,
}: {
	setOpenChatDetailsDialog: Dispatch<SetStateAction<ChatDetailsDialogOpen>>;
}) {
	const { room } = useChatWsContext();

	return (
		<Button
			variant="ghost"
			size="sm"
			className="text-base h-7"
			onClick={() =>
				setOpenChatDetailsDialog({
					view: "details",
				})
			}
		>
			{room?.name}
		</Button>
	);
}

function ChatRoomMembers({
	setOpenChatDetailsDialog,
}: {
	setOpenChatDetailsDialog: Dispatch<SetStateAction<ChatDetailsDialogOpen>>;
}) {
	const { members } = useChatWsContext();

	return (
		<Button
			variant="ghost"
			size="sm"
			className="gap-2 h-7"
			onClick={() =>
				setOpenChatDetailsDialog({
					view: "members",
				})
			}
		>
			<Users className="h-4 w-4" />
			<span>{members.length} Members</span>
		</Button>
	);
}

function ChatRoomConnectionStatus() {
	const { connectionStatus } = useChatWsContext();

	return (
		<Tooltip>
			<TooltipTrigger>
				<div
					className={cn("h-2 w-2 rounded-full transition-colors", {
						"bg-green-500": connectionStatus === "ready",
						"bg-yellow-500": connectionStatus === "connected",
						"bg-orange-500": connectionStatus === "connecting",
						"bg-gray-600": connectionStatus === "disconnected",
					})}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<p className="capitalize">{connectionStatus}</p>
			</TooltipContent>
		</Tooltip>
	);
}
