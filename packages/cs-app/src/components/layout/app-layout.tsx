"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppRightSidebar } from "@/components/layout/app-right-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	SidebarSimpleInset,
	SidebarSimpleProvider,
} from "../ui/sidebar-simple";

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
				<SidebarSimpleProvider>
					<SidebarSimpleInset>{children}</SidebarSimpleInset>
					<AppRightSidebar />
				</SidebarSimpleProvider>
			</SidebarInset>
		</SidebarProvider>
	);
}
