import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { organizationPermissions } from "../../server/auth/organization-permissions";

export const authClient = createAuthClient({
	baseURL: "http://localhost:5173",
	plugins: [
		organizationClient({
			ac: organizationPermissions.accessControl,
			roles: {
				member: organizationPermissions.member,
				admin: organizationPermissions.admin,
				owner: organizationPermissions.owner,
			},
		}),
	],
});
