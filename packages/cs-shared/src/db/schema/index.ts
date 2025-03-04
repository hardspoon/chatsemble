import * as authSchema from "./auth";
import * as chatSchema from "./chat";
import * as agentSchema from "./agent";

export const globalSchema = {
	...authSchema,
	...chatSchema,
	...agentSchema,
};
