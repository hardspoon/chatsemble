export { ChatDurableObject } from "./chat-durable-object";

export default {
	async fetch(_, env) {
		const id: DurableObjectId = env.CHAT_DURABLE_OBJECT.idFromName("main-chat");
		const stub = env.CHAT_DURABLE_OBJECT.get(id);
		await stub.migrate();
		await stub.insert({
			message: "Hello, world!",
		});
		console.log("New message created!");

		const messages = await stub.select();
		console.log("Getting all messages from the database: ", messages);
		return new Response();
	},
} satisfies ExportedHandler<Env>;
