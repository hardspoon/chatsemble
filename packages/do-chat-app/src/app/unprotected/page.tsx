"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedClient } from "@/lib/api-client";

export default function Home() {
	const testDurableObject = async () => {
		try {
			console.log("Fetching messages...");
			const authClient = await getAuthenticatedClient();
			const response = await authClient["chat-room"].create.$post();
			const data = await response.json();
			console.log("Messages:", data);
		} catch (error) {
			console.error("Error fetching messages:", error);
		}
	};
	const testApi = async () => {
		const response = await fetch("/api/test");
		const data = await response.json();
		console.log("Data:", data);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Hello World!</CardTitle>
			</CardHeader>
			<CardContent>
				<p>This is a card</p>
				<Button onClick={testDurableObject}>Click me (Durable Object)</Button>
				<Button onClick={testApi}>Click me (API)</Button>
			</CardContent>
		</Card>
	);
}
