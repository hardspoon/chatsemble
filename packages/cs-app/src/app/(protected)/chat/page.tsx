"use client";

import { Chat } from "@/components/chat/chat";
import { useSearchParams } from "next/navigation";

export default function Home() {
	const queryParams = useSearchParams();
	const roomId = queryParams.get("roomId");

	if (!roomId) {
		return <NoRoomId />;
	}

	return <Chat roomId={roomId} />;
}

function NoRoomId() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center">
			<span className="text-lg font-bold">No room selected</span>
			<p className="text-sm text-muted-foreground">
				Please select a room from the sidebar
			</p>
		</div>
	);
}
