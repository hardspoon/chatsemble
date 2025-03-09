"use client";

import { Card } from "@/components/ui/card";
import { Tiptap } from "@/components/ui/tiptap/tiptap";

export default function TestPage() {
	return (
		<div className="w-screen h-screen p-4">
			<Card className="w-full h-full">
				<Tiptap
					onChange={(output) => {
						console.log("OUTPUT:", output);
					}}
					members={[
						{
							id: "1",
							name: "John Doe",
							roomId: "1",
							role: "member",
							type: "user",
							email: "john.doe@example.com",
						},
						{
							id: "2",
							name: "Jane Doe",
							roomId: "1",
							role: "member",
							type: "user",
							email: "jane.doe@example.com",
						},
					]}
				/>
			</Card>
		</div>
	);
}
