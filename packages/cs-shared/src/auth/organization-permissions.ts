import { createAccessControl } from "better-auth/plugins/access";
import {
	defaultStatements,
	adminAc,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

export type StatementKeys = "chatRoom";

const statement = {
	...defaultStatements,
	chatRoom: ["create", "update", "delete"],
} as const;

const accessControl = createAccessControl(statement);

const member = accessControl.newRole({
	...memberAc.statements,
	chatRoom: ["create"],
});

const admin = accessControl.newRole({
	...adminAc.statements,
	chatRoom: ["create", "update", "delete"],
});

const owner = accessControl.newRole({
	...ownerAc.statements,
	chatRoom: ["create", "update", "delete"],
});

const organizationPermissions = {
	member,
	admin,
	owner,
	accessControl,
};

export { organizationPermissions };
