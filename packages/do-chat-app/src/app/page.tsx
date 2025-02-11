"use client";

import { Button } from "@/components/ui/button";
import { client } from "@/lib/api-client";

export default function Home() {
	const testDurableObject = async () => {
		try {
			console.log("Fetching messages...");
			const response = await client.messages.$get();
			const data = await response.json();
			console.log("Messages:", data);
		} catch (error) {
			console.error("Error fetching messages:", error);
		}
	};

	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<div className="flex h-full w-full flex-col items-center justify-center gap-4">
				<h1 className="text-4xl font-bold">DO Chat</h1>
				<Button onClick={testDurableObject}>Test Durable Object</Button>
			</div>
		</div>
	);
}
