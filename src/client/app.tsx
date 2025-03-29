import { Button } from "@/components/ui/button";
import { honoClient } from "@/lib/api-client";
import { useState } from "react";

function App() {
	const [name, setName] = useState("unknown");

	const fetchUsers = async () => {
		const response = await honoClient.api.users.$get();
		const data = await response.json();

		setName(data.message);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-svh bg-amber-200">
			<Button onClick={fetchUsers}>Click me</Button>
			<p>{name}</p>
		</div>
	);
}

export default App;
