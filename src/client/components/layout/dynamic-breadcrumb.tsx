"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export function DynamicBreadcrumb() {
	/* const pathname = usePathname(); */

	const getBreadcrumbItems = () => {
		const sections = "".split("/").slice(1); // TODO: Add this
		const items = [];
		for (let i = 0; i < sections.length; i++) {
			const section = sections[i];
			items.push(
				<React.Fragment key={`fragment-${section}-${i}`}>
					{i > 0 && <BreadcrumbSeparator />}
					<BreadcrumbItem>
						<BreadcrumbPage>
							{section.charAt(0).toUpperCase() + section.slice(1)}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</React.Fragment>,
			);
		}

		return items;
	};

	return (
		<Breadcrumb>
			<BreadcrumbList>{getBreadcrumbItems()}</BreadcrumbList>
		</Breadcrumb>
	);
}
