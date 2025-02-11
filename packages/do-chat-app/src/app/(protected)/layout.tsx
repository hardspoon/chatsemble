import { getNextAuth } from "@/auth";
import type { ReactNode } from "react";

export default async function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const { auth, signIn } = getNextAuth();
	const session = await auth();

	if (!session) {
		return signIn(undefined, { redirectTo: "/auth/login" });
	}

	return children;
}

export const dynamic = "force-dynamic";
