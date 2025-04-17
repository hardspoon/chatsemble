"use client";

import { useOrganizationConnectionContext } from "@client/components/providers/organization-connection-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@client/components/ui/dropdown-menu";
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
} from "@client/components/ui/sidebar";
import { Skeleton } from "@client/components/ui/skeleton";
import type { ChatRoom, ChatRoomType } from "@shared/types";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowUpRight,
	MessageSquareIcon,
	MoreHorizontal,
	Plus,
	StarOff,
	Trash2,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import {
	type NewChatDialogState,
	NewChatRoomDialog,
} from "../new/new-chat-dialog";

export function ChatRoomList() {
	const [dialogState, setDialogState] = useState<NewChatDialogState>(null);

	const { userState } = useOrganizationConnectionContext();

	return (
		<>
			<NewChatRoomDialog
				dialogState={dialogState}
				setDialogState={setDialogState}
			/>
			{userState.status === "loading" ? (
				<ChatRoomsSkeleton />
			) : userState.status === "error" ? (
				<ChatRoomsError />
			) : (
				userState.chatRooms && (
					<ChatRoomsGroups
						chatRooms={userState.chatRooms}
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
	setDialogState: Dispatch<SetStateAction<NewChatDialogState>>;
}) {
	const route = getRouteApi("/(app)/chat");
	const { roomId } = route.useSearch();

	return (
		<ChatRoomsGroup
			title="Chats"
			chatRooms={chatRooms}
			chatType="public"
			setDialogState={setDialogState}
			selectedChatRoomId={roomId ?? null}
		/>
	);
}

function ChatRoomsGroup({
	title,
	chatRooms,
	selectedChatRoomId,
	setDialogState,
}: {
	title: string;
	chatRooms: ChatRoom[];
	chatType: ChatRoomType;
	setDialogState: Dispatch<SetStateAction<NewChatDialogState>>;
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
						type: "public",
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
