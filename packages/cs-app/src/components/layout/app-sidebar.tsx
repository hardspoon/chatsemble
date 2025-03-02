"use client";

import { Bot, MessageSquare, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type * as React from "react";

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
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LogoIcon } from "../icons/logo-icon";
import { ThemeToggle } from "../theme-toggle";
import { AppInnerSidebarContent } from "./app-inner-sidebar";

// Updated sample data with activeMatch regex
const navMain = [
	{
		title: "Chats",
		url: "/chat", // Redirect URL
		icon: MessageSquare,
		activeMatch: /^\/chat/, // Exact match for home
	},
	{
		title: "Agents",
		url: "/agents", // Redirect URL
		icon: Bot,
		activeMatch: /^\/agents/, // Matches any agents route
	},
	{
		title: "Settings",
		url: "/settings/profile", // Redirect URL
		icon: Settings,
		activeMatch: /^\/settings/, // Matches any settings route
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const router = useRouter();
	const { setOpen, isMobile } = useSidebar();

	// For mobile, we'll use a different internal structure but still use the Sidebar component
	if (isMobile) {
		return (
			<Sidebar {...props}>
				{/* Mobile Header with Logo */}
				<SidebarHeader className="border-b p-4">
					<div className="flex items-center">
						<LogoIcon className="size-6 mr-2" />
						<span className="font-semibold text-sm">Chatsemble</span>
					</div>
				</SidebarHeader>

				{/* Horizontal Navigation */}
				<div className="border-b overflow-x-auto">
					<div className="flex p-2 gap-1">
						{navMain.map((item) => (
							<Link
								key={item.title}
								href={item.url}
								/* onClick={() => {
									setOpenMobile(false);
								}} */
								className={cn(
									"flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors",
									item.activeMatch.test(pathname)
										? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
										: "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground/90",
								)}
							>
								<item.icon className="size-4" />
								<span>{item.title}</span>
							</Link>
						))}
					</div>
				</div>

				{/* Inner Content Section */}
				<SidebarContent className="overflow-auto">
					<AppInnerSidebarContent />
				</SidebarContent>

				{/* Footer with user and theme toggle */}
				<SidebarFooter className="border-t p-3 flex items-center justify-between">
					<NavUser />
					<ThemeToggle />
				</SidebarFooter>
			</Sidebar>
		);
	}

	// Desktop version (unchanged)
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
			<Sidebar collapsible="none" className="hidden flex-1 md:flex">
				<AppInnerSidebarContent />
			</Sidebar>
		</Sidebar>
	);
}
