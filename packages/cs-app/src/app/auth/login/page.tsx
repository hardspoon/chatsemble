import { headers } from "next/headers";

import { getAuth } from "@/auth";
import { LoggedInCard } from "@/app/auth/_components/logged-in-card";
import LoginForm from "@/app/auth/login/_components/login-form";

export default async function LoginPage() {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session?.user) {
		return <LoggedInCard email={session.user.email} />;
	}

	return <LoginForm />;
}

export const dynamic = "force-dynamic";
