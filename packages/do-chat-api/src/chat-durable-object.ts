/// <reference types="@cloudflare/workers-types" />
import {
	drizzle,
	type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { DurableObject } from "cloudflare:workers";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "./db/migrations/migrations";
import { chatMessagesTable } from "./db/schema";
import { eq } from "drizzle-orm";

export class ChatDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async insert(message: typeof chatMessagesTable.$inferInsert) {
		await this.db.insert(chatMessagesTable).values(message);
	}

	async select() {
		const messages = await this.db.select().from(chatMessagesTable);
		console.log("Messages:", messages);
		return messages;
	}

	async getOne(id: string) {
		const results = await this.db
			.select()
			.from(chatMessagesTable)
			.where(eq(chatMessagesTable.id, id));
		if (results.length === 0) {
			return null;
		}
		return results[0];
	}
}
