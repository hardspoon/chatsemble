import { getAuth } from "@/auth";
import { ChatRoom } from "@/components/chat/layout/chat-room";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ChatPage() {
	const auth = getAuth();
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/auth/login");
	}

	return <ChatRoom user={session.user} />;
}
