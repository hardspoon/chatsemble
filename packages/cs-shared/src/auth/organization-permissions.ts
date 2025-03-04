import { createAccessControl } from "better-auth/plugins/access";
import {
	defaultStatements,
	adminAc,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

export type StatementKeys = "chatRoom" | "chatRoomMember";

const statement = {
	...defaultStatements,
	chatRoom: ["create", "update", "delete"],
	chatRoomMember: ["create", "delete"],
} as const;

const accessControl = createAccessControl(statement);

const member = accessControl.newRole({
	...memberAc.statements,
	chatRoom: ["create"],
	chatRoomMember: [],
});

const admin = accessControl.newRole({
	...adminAc.statements,
	chatRoom: ["create", "update", "delete"],
	chatRoomMember: ["create", "delete"],
});

const owner = accessControl.newRole({
	...ownerAc.statements,
	chatRoom: ["create", "update", "delete"],
	chatRoomMember: ["create", "delete"],
});

const organizationPermissions = {
	member,
	admin,
	owner,
	accessControl,
};

export { organizationPermissions };
