"use client";

import { usePathname } from "next/navigation";
import { AgentsSidebar } from "../../app/(protected)/agents/_components/agents-sidebar";
import { ChatsSidebar } from "../chat/chats-sidebar";
import { SettingsSidebar } from "../settings/settings-sidebar";
import { Sidebar } from "../ui/sidebar";

export function AppInnerSidebar() {
	return (
		<Sidebar collapsible="none" className="hidden flex-1 md:flex">
			<AppInnerSidebarContent />
		</Sidebar>
	);
}

function AppInnerSidebarContent() {
	const pathname = usePathname();

	if (pathname.startsWith("/chat")) {
		return <ChatsSidebar />;
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
