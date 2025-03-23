import { getAuth } from "@/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { globalSchema } from "@/cs-shared";
import { getDB } from "@/server/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const auth = getAuth();
	const headersList = await headers();
	const session = await auth.api.getSession({
		headers: headersList,
	});

	if (!session) {
		return redirect("/auth/login");
	}

	if (!session.session.activeOrganizationId) {
		console.log("no active organization, checking if user has any");
		const db = getDB();
		// TODO: Create a db service for this
		const orgSession = await db.query.organizationMember.findFirst({
			where: eq(globalSchema.organizationMember.userId, session.user.id),
		});
		console.log("orgSession", orgSession);

		if (!orgSession) {
			console.log(
				"no organization found, redirecting to create organization page",
			);
			return redirect("/auth/create-organization");
		}

		await auth.api.setActiveOrganization({
			headers: headersList,
			body: {
				organizationId: orgSession?.organizationId,
			},
		});
	}

	return <SidebarProvider>{children}</SidebarProvider>;
}

export const dynamic = "force-dynamic";
