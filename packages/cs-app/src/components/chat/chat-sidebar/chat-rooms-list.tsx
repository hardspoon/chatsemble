import {
	type DialogState,
	NewChatRoomDialog,
} from "@/components/chat/new-chat/new-chat-dialog";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatRoom, ChatRoomType } from "@/cs-shared";
import { client } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
	AlertCircle,
	ChevronDown,
	ChevronRight,
	MessageSquareDot,
	MessageSquareLock,
	MessageSquarePlus,
	Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";

export function ChatRoomsList() {
	const [dialogState, setDialogState] = useState<DialogState>(null);

	const {
		data: chatRoomsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["chatRooms"],
		queryFn: async () => {
			const response = await client.protected.chat["chat-rooms"].$get();
			const data = await response.json();
			return data;
		},
	});

	return (
		<>
			<NewChatRoomDialog
				dialogState={dialogState}
				setDialogState={setDialogState}
			/>
			<SidebarHeader className="gap-3.5 border-b p-4">
				<div className="flex w-full items-center justify-between">
					<div className="text-base font-medium text-foreground">Chats</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
							>
								<Plus className="h-4 w-4" />
								New chat
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								onClick={() => {
									setDialogState({ type: "publicGroup" });
								}}
							>
								<MessageSquareDot className="h-4 w-4" />
								New public group
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setDialogState({ type: "privateGroup" });
								}}
							>
								<MessageSquareLock className="h-4 w-4" />
								New private group
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setDialogState({ type: "oneToOne" });
								}}
							>
								<MessageSquarePlus className="h-4 w-4" />
								New direct message
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<SidebarInput placeholder="Search chats..." />
			</SidebarHeader>
			<SidebarContent>
				{isLoading ? (
					<ChatRoomsSkeleton />
				) : error ? (
					<ChatRoomsError />
				) : (
					chatRoomsData && (
						<ChatRoomsGroups
							chatRooms={chatRoomsData}
							setDialogState={setDialogState}
						/>
					)
				)}
			</SidebarContent>
		</>
	);
}

function ChatRoomsGroups({
	chatRooms,
	setDialogState,
}: {
	chatRooms: ChatRoom[];
	setDialogState: Dispatch<SetStateAction<DialogState>>;
}) {
	const queryParams = useSearchParams();
	const selectedChatRoomId = queryParams.get("roomId");

	// Group chat rooms by type
	const publicChats = useMemo(
		() => chatRooms.filter((chat) => chat.type === "publicGroup"),
		[chatRooms],
	);
	const privateChats = useMemo(
		() => chatRooms.filter((chat) => chat.type === "privateGroup"),
		[chatRooms],
	);
	const oneToOneChats = useMemo(
		() => chatRooms.filter((chat) => chat.type === "oneToOne"),
		[chatRooms],
	);

	return (
		<div className="flex flex-col w-full">
			<ChatRoomsGroup
				title="Public Chats"
				chatRooms={publicChats}
				chatType="publicGroup"
				setDialogState={setDialogState}
				selectedChatRoomId={selectedChatRoomId}
			/>

			<ChatRoomsGroup
				title="Private Groups"
				chatRooms={privateChats}
				chatType="privateGroup"
				setDialogState={setDialogState}
				selectedChatRoomId={selectedChatRoomId}
			/>

			<ChatRoomsGroup
				title="Direct Messages"
				chatRooms={oneToOneChats}
				chatType="oneToOne"
				setDialogState={setDialogState}
				selectedChatRoomId={selectedChatRoomId}
			/>
		</div>
	);
}

function ChatRoomsGroup({
	title,
	chatRooms,
	chatType,
	setDialogState,
	selectedChatRoomId,
}: {
	title: string;
	chatRooms: ChatRoom[];
	chatType: ChatRoomType;
	setDialogState: Dispatch<SetStateAction<DialogState>>;
	selectedChatRoomId: string | null;
}) {
	const [isOpen, setIsOpen] = useState(true);

	// TODO: highlight the selected chat room

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
			<div className="flex items-center justify-between px-2 py-1 border-b bg-sidebar-accent/30">
				<CollapsibleTrigger asChild>
					<Button
						variant="link"
						size="sm"
						className="w-full flex justify-start"
					>
						<div className="flex items-center gap-1">
							{isOpen ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
							<span className="text-sm ml-1">{title}</span>
							{chatRooms.length > 0 && (
								<span className="text-sm text-muted-foreground ml-1">
									({chatRooms.length})
								</span>
							)}
						</div>
					</Button>
				</CollapsibleTrigger>
				<Button
					variant="ghost"
					size="icon"
					title={`Create new ${chatType === "publicGroup" ? "public chat" : chatType === "privateGroup" ? "private group" : "direct message"}`}
					onClick={() => {
						setDialogState({ type: chatType });
					}}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			<CollapsibleContent>
				<SidebarGroup className="px-0 py-0">
					<SidebarGroupContent>
						{chatRooms.length > 0 ? (
							chatRooms.map((chat) => (
								<ChatRoomItem
									key={chat.id}
									chat={chat}
									selectedChatRoomId={selectedChatRoomId}
								/>
							))
						) : (
							<div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
								No{" "}
								{chatType === "publicGroup"
									? "public chats"
									: chatType === "privateGroup"
										? "private groups"
										: "direct messages"}{" "}
								found
							</div>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</CollapsibleContent>
		</Collapsible>
	);
}

function ChatRoomItem({
	chat,
	selectedChatRoomId,
}: {
	chat: ChatRoom;
	selectedChatRoomId: string | null;
}) {
	const router = useRouter();
	const { setOpenMobile } = useSidebar();

	return (
		<button
			type="button"
			onClick={() => {
				router.push(`/chat?roomId=${chat.id}`);
				setOpenMobile(false);
			}}
			className={cn(
				"flex w-full flex-col gap-1 border-b px-4 py-3 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				selectedChatRoomId === chat.id &&
					"bg-accent text-accent-foreground font-bold",
			)}
		>
			<div className="w-full flex items-center justify-between">
				<span className="font-medium">{chat.name}</span>
			</div>
		</button>
	);
}

function ChatRoomsError() {
	return (
		<div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
			<AlertCircle className="h-4 w-4" />
			Error fetching chats
		</div>
	);
}

function ChatRoomsSkeleton() {
	return (
		<div className="flex flex-col w-full">
			{/* Public Chats Section Skeleton */}
			<div className="w-full">
				<div className="flex items-center justify-between px-4 py-2 border-b bg-sidebar-accent/30">
					<div className="flex items-center gap-1">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-6 w-6 rounded-md" />
				</div>
				<div>
					<div className="flex flex-col gap-1 border-b px-4 py-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-12" />
						</div>
					</div>
					<div className="flex flex-col gap-1 border-b px-4 py-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-12" />
						</div>
					</div>
				</div>
			</div>

			{/* Private Groups Section Skeleton */}
			<div className="w-full">
				<div className="flex items-center justify-between px-4 py-2 border-b bg-sidebar-accent/30">
					<div className="flex items-center gap-1">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-6 w-6 rounded-md" />
				</div>
				<div>
					<div className="flex flex-col gap-1 border-b px-4 py-3">
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-12" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
