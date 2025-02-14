"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/auth-client";

export default function Home() {
	/* const testDurableObject = async () => {
		try {
			console.log("Fetching messages...");
			const response = await client["chat-room"].create.$post();
			const data = await response.json();
			console.log("Messages:", data);
		} catch (error) {
			console.error("Error fetching messages:", error);
		}
	}; */

	const { data: session } = authClient.useSession();

	console.log("session", session);

	return (
		<main className="flex flex-1 flex-col gap-4 p-4 items-center justify-center">
			<Card>
				<CardHeader>
					<CardTitle>Hello World!</CardTitle>
				</CardHeader>
				<CardContent>
					<p>This is a card</p>
					<Button>Click me</Button>
				</CardContent>
			</Card>
		</main>
	);
}
