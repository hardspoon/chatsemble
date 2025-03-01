import { getAuth } from "@/auth";
import { Chat } from "@/components/chat/chat";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/auth/login");
	}

	return <Chat user={session.user} />;
}
