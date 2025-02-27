import AppLayout from "@/components/layout/app-layout";
import { getAuth } from "@/lib/auth/auth-server";
import { getDB } from "@/server/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { schema } from "@/cs-shared";

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
		const db = getDB();
		const orgSession = await db.query.member.findFirst({
			where: eq(schema.member.userId, session.user.id),
		});
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
