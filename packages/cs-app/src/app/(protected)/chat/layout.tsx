import { ChatRoomList } from "@/components/chat/layout/sidebar/chat-room-list";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function ChatRoomLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar>
				<ChatRoomList />
			</AppSidebar>
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
