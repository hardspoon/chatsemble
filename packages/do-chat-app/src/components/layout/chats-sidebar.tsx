import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
} from "@/components/ui/sidebar";

interface Chat {
	id: string;
	name: string;
	lastMessage: string;
	timestamp: string;
}

interface ChatsSidebarProps {
	chats: Chat[];
}

export function ChatsSidebar({ chats }: ChatsSidebarProps) {
	return (
		<>
			<SidebarHeader className="gap-3.5 border-b p-4">
				<div className="flex w-full items-center justify-between">
					<div className="text-base font-medium text-foreground">Chats</div>
					<Button variant="outline" size="sm">
						<Plus className="h-4 w-4" />
						New Chat
					</Button>
				</div>
				<SidebarInput placeholder="Search chats..." />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="px-0">
					<SidebarGroupContent>
						{chats.map((chat) => (
							<a
								href={`/chat/${chat.id}`}
								key={chat.id}
								className="flex flex-col gap-1 border-b p-4 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							>
								<div className="flex items-center justify-between">
									<span className="font-medium">{chat.name}</span>
									<span className="text-xs text-muted-foreground">
										{chat.timestamp}
									</span>
								</div>
								<span className="line-clamp-1 text-xs text-muted-foreground">
									{chat.lastMessage}
								</span>
							</a>
						))}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</>
	);
}
