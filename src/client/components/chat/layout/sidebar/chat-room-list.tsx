"use client";

import {
	type DialogState,
	NewChatRoomDialog,
} from "@/components/chat/new-chat/new-chat-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { honoClient } from "@/lib/api-client";
import type { ChatRoom, ChatRoomType } from "@/shared/types";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowUpRight,
	MessageSquareIcon,
	MoreHorizontal,
	Plus,
	StarOff,
	Trash2,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";

export function ChatRoomList() {
	const [dialogState, setDialogState] = useState<DialogState>(null);

	const {
		data: chatRoomsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["chatRooms"],
		queryFn: async () => {
			const response = await honoClient.api.chat["chat-rooms"].$get();
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
	const route = getRouteApi("/(app)/chat");
	const { roomId } = route.useSearch();
	const selectedChatRoomId = roomId;
	// Group chat rooms by type
	const groupChats = useMemo(
		() =>
			chatRooms.filter(
				(chat) => chat.type === "publicGroup" || chat.type === "privateGroup",
			),
		[chatRooms],
	);

	const oneToOneChats = useMemo(
		() => chatRooms.filter((chat) => chat.type === "oneToOne"),
		[chatRooms],
	);

	return (
		<>
			<ChatRoomsGroup
				title="Groups"
				chatRooms={groupChats}
				chatType="publicGroup"
				setDialogState={setDialogState}
				selectedChatRoomId={selectedChatRoomId ?? null}
			/>
			<ChatRoomsGroup
				title="Direct Messages"
				chatRooms={oneToOneChats}
				chatType="oneToOne"
				setDialogState={setDialogState}
				selectedChatRoomId={selectedChatRoomId ?? null}
			/>
		</>
	);
}

function ChatRoomsGroup({
	title,
	chatRooms,
	chatType,
	selectedChatRoomId,
	setDialogState,
}: {
	title: string;
	chatRooms: ChatRoom[];
	chatType: ChatRoomType;
	setDialogState: Dispatch<SetStateAction<DialogState>>;
	selectedChatRoomId: string | null;
}) {
	const { isMobile } = useSidebar();

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>{title}</SidebarGroupLabel>
			<SidebarGroupAction
				title="Add Project"
				onClick={() =>
					setDialogState({
						type: chatType === "oneToOne" ? "oneToOne" : "publicGroup",
					})
				}
			>
				<Plus /> <span className="sr-only">Add Project</span>
			</SidebarGroupAction>
			<SidebarMenu>
				{chatRooms.length ? (
					chatRooms.map((chatRoom) => (
						<SidebarMenuItem key={chatRoom.id}>
							<SidebarMenuButton
								asChild
								isActive={selectedChatRoomId === chatRoom.id}
							>
								<Link
									to="/chat"
									search={{ roomId: chatRoom.id }}
									title={chatRoom.name}
								>
									<MessageSquareIcon />
									<span>{chatRoom.name}</span>
								</Link>
							</SidebarMenuButton>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuAction showOnHover>
										<MoreHorizontal />
										<span className="sr-only">More</span>
									</SidebarMenuAction>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-56 rounded-lg"
									side={isMobile ? "bottom" : "right"}
									align={isMobile ? "end" : "start"}
								>
									<DropdownMenuItem>
										<StarOff className="text-muted-foreground" />
										<span>Remove from Favorites</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />

									<DropdownMenuItem>
										<ArrowUpRight className="text-muted-foreground" />
										<span>Open in New Tab</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<Trash2 className="text-muted-foreground" />
										<span>Delete</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					))
				) : (
					<SidebarMenuItem>
						<div className="p-2 text-sm text-sidebar-foreground/70">
							No chats found
						</div>
					</SidebarMenuItem>
				)}
			</SidebarMenu>
		</SidebarGroup>
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

function SkeletonGroup({ listLength }: { listLength: number }) {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>
				<Skeleton className="h-4 w-32" />
			</SidebarGroupLabel>
			<SidebarGroupAction>
				<Skeleton className="size-4" />
			</SidebarGroupAction>
			<SidebarMenu>
				{Array.from({ length: listLength }).map((_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<SidebarMenuItem key={index}>
						<SidebarMenuSkeleton />
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

function ChatRoomsSkeleton() {
	return (
		<>
			<SkeletonGroup listLength={2} />
			<SkeletonGroup listLength={3} />
		</>
	);
}
