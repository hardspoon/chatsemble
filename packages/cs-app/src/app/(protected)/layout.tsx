import { getAuth } from "@/auth";
import AppLayout from "@/components/layout/app-layout";
import { schema } from "@/cs-shared";
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
		const orgSession = await db.query.organizationMember.findFirst({
			where: eq(schema.organizationMember.userId, session.user.id),
		});
		console.log("orgSession", orgSession);

		if (!orgSession) {
			console.log(
				"no organization found, redirecting to create organization page",
			);
			return redirect("/auth/create-organization");
		}

		auth.api.setActiveOrganization({
			headers: headersList,
			body: {
				organizationId: orgSession?.organizationId,
			},
		});
	}

	return <AppLayout>{children}</AppLayout>;
}

export const dynamic = "force-dynamic";
