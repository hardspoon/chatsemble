"use client";

import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsLinks = [
	{
		title: "Profile Settings",
		href: "/settings/profile",
	},
	{
		title: "Notifications",
		href: "/settings/notifications",
	},
	{
		title: "Appearance",
		href: "/settings/appearance",
	},
];

export function SettingsSidebar() {
	const pathname = usePathname();

	return (
		<>
			<SidebarHeader className="gap-3.5 border-b p-4">
				<div className="flex w-full items-center justify-between">
					<div className="text-base font-medium text-foreground">Settings</div>
				</div>
				<SidebarInput placeholder="Search settings..." />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="px-0 py-0">
					<SidebarGroupContent>
						<div className="flex flex-col">
							{settingsLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={cn(
										"px-4 py-3 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
										pathname === link.href &&
											"bg-sidebar-accent text-sidebar-accent-foreground",
									)}
								>
									{link.title}
								</Link>
							))}
						</div>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</>
	);
}
