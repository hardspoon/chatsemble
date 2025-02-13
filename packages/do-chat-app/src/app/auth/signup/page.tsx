import { headers } from "next/headers";

import { LoggedInCard } from "@/components/auth/logged-in-card";
import { getAuth } from "@/auth";
import SignupForm from "./_components/signup-form";

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
