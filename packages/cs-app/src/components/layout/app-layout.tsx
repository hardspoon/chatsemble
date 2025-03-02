"use client";

import { AppRightSidebar } from "@/components/layout/app-right-sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarRightProvider } from "../ui/sidebar-right";

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
			<SidebarInset>
				<SidebarRightProvider defaultOpen={false}>
					<SidebarInset>{children}</SidebarInset>
					<AppRightSidebar />
				</SidebarRightProvider>
			</SidebarInset>
		</SidebarProvider>
	);
}
