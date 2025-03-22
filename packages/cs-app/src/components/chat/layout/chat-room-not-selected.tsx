import { AppHeader } from "@/components/layout/app-header";

export function ChatRoomNotSelected() {
	return (
		<>
			<AppHeader />
			<div className="flex flex-1 flex-col items-center justify-center">
				<div className="max-w-md text-center">
					<h2 className="mb-2 text-xl font-bold">No chat room selected</h2>
					<p className="text-muted-foreground">
						Select a chat room from the sidebar to start chatting
					</p>
				</div>
			</div>
		</>
	);
}
