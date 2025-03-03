import type { DrizzleDB } from "@/cs-shared";
import type { getAuth } from "../lib/auth";

type Auth = ReturnType<typeof getAuth>;

type HonoVariables = {
	user: Auth["$Infer"]["Session"]["user"] | null;
	session: Auth["$Infer"]["Session"]["session"] | null;
	db: DrizzleDB;
	auth: Auth | null;
};

export type HonoContext = {
	Bindings: Env;
	Variables: HonoVariables;
};

export type HonoContextWithAuth = HonoContext & {
	Variables: HonoVariables & {
		user: NonNullable<HonoVariables["user"]>;
		session: NonNullable<HonoVariables["session"]>;
		auth: NonNullable<HonoVariables["auth"]>;
	};
};
