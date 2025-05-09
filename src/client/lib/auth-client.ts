import { organizationPermissions } from "@server/auth/organization-permissions";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const API_HOST = import.meta.env.VITE_APP_URL || "http://localhost:5173";

export const authClient = createAuthClient({
	baseURL: API_HOST,
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

const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
