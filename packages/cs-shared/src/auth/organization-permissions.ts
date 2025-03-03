import { createAccessControl } from "better-auth/plugins/access";
import {
	defaultStatements,
	adminAc,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * make sure to use `as const` so typescript can infer the type correctly
 */
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
