"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

export function DynamicBreadcrumb() {
	const pathname = usePathname();

	const getBreadcrumbItems = () => {
		if (pathname === "/") {
			return [
				<BreadcrumbItem key="chats">
					<BreadcrumbPage>Chats</BreadcrumbPage>
				</BreadcrumbItem>,
			];
		}
		if (pathname.startsWith("/settings")) {
			const section = pathname.split("/")[2];
			const items = [
				<BreadcrumbItem key="settings">
					<BreadcrumbPage>Settings</BreadcrumbPage>
				</BreadcrumbItem>,
			];

			if (section) {
				items.push(
					<BreadcrumbSeparator key="separator" />,
					<BreadcrumbItem key={section}>
						<BreadcrumbPage>
							{section.charAt(0).toUpperCase() + section.slice(1)}
						</BreadcrumbPage>
					</BreadcrumbItem>,
				);
			}
			return items;
		}
		return [];
	};

	return (
		<Breadcrumb>
			<BreadcrumbList>{getBreadcrumbItems()}</BreadcrumbList>
		</Breadcrumb>
	);
}
