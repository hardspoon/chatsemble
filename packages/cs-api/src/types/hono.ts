import type { DrizzleDB } from "@/cs-shared";
import type { getAuth } from "../lib/auth";

type Auth = ReturnType<typeof getAuth>;

export type HonoContext = {
	Bindings: Env;
	Variables: {
		user: Auth["$Infer"]["Session"]["user"] | null;
		session: Auth["$Infer"]["Session"]["session"] | null;
		db: DrizzleDB;
		auth: Auth | null;
	};
};

export type HonoContextWithAuth = HonoContext & {
	Variables: HonoContext["Variables"] & {
		user: NonNullable<HonoContext["Variables"]["user"]>;
		session: NonNullable<HonoContext["Variables"]["session"]> & {
			activeOrganizationId: string;
		};
		auth: NonNullable<HonoContext["Variables"]["auth"]>;
	};
};
