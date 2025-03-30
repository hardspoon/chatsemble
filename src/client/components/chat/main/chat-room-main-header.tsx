import { useChatWsContext } from "@client/components/chat/providers/chat-ws-provider";

import { ChatDetailsDialog } from "@client/components/chat/main/chat-room-details/chat-details-dialog";
import type { ChatDetailsDialogOpen } from "@client/components/chat/main/chat-room-details/chat-details-dialog";
import {
	AppHeader,
	AppHeaderIcon,
	AppHeaderSeparator,
} from "@client/components/layout/app-header";
import { Button } from "@client/components/ui/button";
import { Skeleton } from "@client/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@client/components/ui/tooltip";
import { cn } from "@client/lib/utils";
import { MessagesSquare, Users } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";

export function ChatRoomMainHeader() {
	const [openChatDetailsDialog, setOpenChatDetailsDialog] =
		useState<ChatDetailsDialogOpen>(null);

	const {
		connectionStatus,
		mainChat: { status },
	} = useChatWsContext();

	return (
		<AppHeader>
			<AppHeaderIcon className="hidden md:flex">
				<MessagesSquare />
			</AppHeaderIcon>
			<AppHeaderSeparator className="hidden md:block" />
			{connectionStatus === "connected" && status === "success" ? (
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
		</AppHeader>
	);
}

function ChatRoomName({
	setOpenChatDetailsDialog,
}: {
	setOpenChatDetailsDialog: Dispatch<SetStateAction<ChatDetailsDialogOpen>>;
}) {
	const {
		mainChat: { room },
	} = useChatWsContext();

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
	const {
		mainChat: { members },
	} = useChatWsContext();

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
						"bg-green-500": connectionStatus === "connected",
						"bg-yellow-500": connectionStatus === "connecting",
						"bg-orange-500": connectionStatus === "disconnected",
					})}
				/>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<p className="capitalize">{connectionStatus}</p>
			</TooltipContent>
		</Tooltip>
	);
}
