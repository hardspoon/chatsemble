import { Button } from "@client/components/ui/button";
import { honoClient } from "@client/lib/api-client";

function App() {
	const fetchUsers = async () => {
		const response = await honoClient.api.chat["chat-rooms"].$get();
		const data = await response.json();

		console.log(data);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-svh bg-amber-200">
			<Button onClick={fetchUsers}>Click me</Button>
		</div>
	);
}

export default App;
