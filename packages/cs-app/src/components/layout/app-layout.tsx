import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
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
			<SidebarInset className="flex flex-col h-screen overflow-y-auto">
				<AppHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
