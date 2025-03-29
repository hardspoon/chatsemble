import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/chat")({
	component: Chat,
});

function Chat() {
	return <div className="p-2">Hello from Chat!</div>;
}
