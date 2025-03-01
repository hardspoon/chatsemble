import { headers } from "next/headers";

import { getAuth } from "@/auth";
import { LoggedInCard } from "@/app/auth/_components/logged-in-card";
import SignupForm from "@/app/auth/signup/_components/signup-form";

export default async function SignupPage() {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session?.user) {
		return <LoggedInCard email={session.user.email} />;
	}

	return <SignupForm />;
}

export const dynamic = "force-dynamic";
