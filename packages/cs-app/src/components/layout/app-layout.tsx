"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppRightSidebar } from "@/components/layout/app-right-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "350px",
				} as React.CSSProperties
			}
		>
			<AppSidebar />
			<SidebarInset className="flex flex-col h-screen overflow-auto">
				{children}
			</SidebarInset>

			<AppRightSidebar />
		</SidebarProvider>
	);
}
