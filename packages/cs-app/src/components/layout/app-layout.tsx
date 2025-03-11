"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarRightProvider } from "../ui/sidebar-right";
import { useSearchParams } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const queryParams = useSearchParams();
	const roomId = queryParams.get("roomId");
	const threadId = queryParams.get("threadId");

	const defaultOpen = !!roomId && !!threadId;

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "350px",
				} as React.CSSProperties
			}
		>
			<AppSidebar />
			<SidebarInset>
				<SidebarRightProvider defaultOpen={defaultOpen}>
					{children}
				</SidebarRightProvider>
			</SidebarInset>
		</SidebarProvider>
	);
}
