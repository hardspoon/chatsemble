"use client";

import { Button } from "@/components/ui/button";

export default function Home() {
	const testDurableObject = async () => {
		const response = await fetch(
			`http://${process.env.NEXT_PUBLIC_DO_CHAT_API_HOST}/messages`,
		);
		const data = await response.json();
		console.log(data);
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
