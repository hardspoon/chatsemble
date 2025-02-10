export { ChatDurableObject } from "./chat-durable-object";

export default {
	async fetch(request, env) {
		// Handle CORS preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		const id: DurableObjectId = env.CHAT_DURABLE_OBJECT.idFromName("main-chat");
		const stub = env.CHAT_DURABLE_OBJECT.get(id);
		await stub.migrate();
		await stub.insert({
			message: "Hello, world!",
		});
		console.log("New message created!");

		const messages = await stub.select();
		console.log("Getting all messages from the database: ", messages);
		return new Response(
			JSON.stringify({
				messages,
			}),
			{
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			},
		);
	},
} satisfies ExportedHandler<Env>;
