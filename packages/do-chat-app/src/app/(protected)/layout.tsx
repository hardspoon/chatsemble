import AppLayout from "@/components/layout/app-layout";
import { getAuth } from "@/lib/auth/auth-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/auth/login");
	}

	return <AppLayout>{children}</AppLayout>;
}

export const dynamic = "force-dynamic";
