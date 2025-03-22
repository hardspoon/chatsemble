"use client";

import { Bot, MessageSquare, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import type * as React from "react";

import { AppNavUser } from "@/components/layout/app-nav-user";
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
	SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { LogoIcon } from "../icons/logo-icon";
import { ThemeToggle } from "../theme-toggle";

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
];

export function AppSidebar({ children }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<a href="/">
								<LogoIcon className="!size-6" />
								<span className="flex-1 text-left text-sm leading-tight font-semibold">
									Chatsemble
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarSeparator />
				<NavMain currentPath={pathname} />
				<SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
				{children}
				<NavSecondary currentPath={pathname} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<AppNavUser />
			</SidebarFooter>
		</Sidebar>
	);
}

function NavMain({ currentPath }: { currentPath: string }) {
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{navMain.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								tooltip={item.title}
								isActive={item.activeMatch.test(currentPath)}
								asChild
							>
								<Link href={item.url}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function NavSecondary({
	currentPath,
	...props
}: { currentPath: string } & React.ComponentPropsWithoutRef<
	typeof SidebarGroup
>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							size="sm"
							isActive={currentPath === "/settings/profile"}
						>
							<a href="/settings/profile">
								<Settings />
								<span>Settings</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<ThemeToggle />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
