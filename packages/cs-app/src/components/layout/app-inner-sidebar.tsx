"use client";

import { AgentsSidebar } from "@/app/(protected)/agents/_components/agents-sidebar";
import { ChatRoomsList } from "@/app/(protected)/chat/_components/chat-sidebar/chat-rooms-list";
import { SettingsSidebar } from "@/app/(protected)/settings/_components/settings-sidebar";
import { usePathname } from "next/navigation";

// Export this separately so it can be used in both desktop and mobile layouts
export function AppInnerSidebarContent() {
	const pathname = usePathname();

	if (pathname.startsWith("/chat")) {
		return <ChatRoomsList />;
	}

	if (pathname.startsWith("/settings")) {
		return <SettingsSidebar />;
	}

	if (pathname.startsWith("/agents")) {
		return <AgentsSidebar />;
	}

	return <AppInnerSidebarPlaceholder />;
}

function AppInnerSidebarPlaceholder() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<span className="text-sm text-muted-foreground">No content</span>
		</div>
	);
}
