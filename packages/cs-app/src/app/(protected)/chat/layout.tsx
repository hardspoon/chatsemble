import { ChatRoomList } from "@/components/chat/layout/sidebar/chat-room-list";
import { AppLayout } from "@/components/layout/app-layout";

export default function ChatRoomLayout({
	children,
}: { children: React.ReactNode }) {
	return <AppLayout sidebarChildren={<ChatRoomList />}>{children}</AppLayout>;
}
