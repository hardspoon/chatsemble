export function ChatPlaceholderNoRoomSelected() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center">
			<span className="text-lg font-bold">No room selected</span>
			<p className="text-sm text-muted-foreground">
				Please select a room from the sidebar
			</p>
		</div>
	);
}
