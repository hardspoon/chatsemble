"use client";

import type * as React from "react";
import { Bot, MessageSquare, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { NavUser } from "@/components/layout/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { LogoIcon } from "../icons/logo-icon";
import { AppInnerSidebar } from "./app-inner-sidebar";

// Updated sample data with activeMatch regex
const navMain = [
	{
		title: "Chats",
		url: "/chat", // Redirect URL
		icon: MessageSquare,
		activeMatch: /^\/chat/, // Exact match for home
	},
	{
		title: "Settings",
		url: "/settings/profile", // Redirect URL
		icon: Settings,
		activeMatch: /^\/settings/, // Matches any settings route
	},
	{
		title: "Agents",
		url: "/agents", // Redirect URL
		icon: Bot,
		activeMatch: /^\/agents/, // Matches any agents route
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const router = useRouter();
	const { setOpen } = useSidebar();

	return (
		<Sidebar
			collapsible="icon"
			className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
			{...props}
		>
			{/* First sidebar - navigation icons */}
			<Sidebar
				collapsible="none"
				className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
			>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
								<a href="/chat">
									<div className="flex aspect-square size-8 items-center justify-center">
										<LogoIcon className="size-8" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">Chatsemble</span>
										<span className="truncate text-xs">Chatting with AI</span>
									</div>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent className="px-1.5 md:px-0">
							<SidebarMenu>
								{navMain.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											tooltip={{
												children: item.title,
												hidden: false,
											}}
											onClick={() => {
												router.push(item.url);
												setOpen(true);
											}}
											isActive={item.activeMatch.test(pathname)}
											className="px-2.5 md:px-2"
											asChild
										>
											<Link href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<ThemeToggle />
					<NavUser />
				</SidebarFooter>
			</Sidebar>

			{/* Second sidebar - content */}
			<AppInnerSidebar />
		</Sidebar>
	);
}
