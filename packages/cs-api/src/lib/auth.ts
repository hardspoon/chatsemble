import { type AuthBaseConfig, getAuthBaseConfig } from "@/cs-shared";
import { betterAuth } from "better-auth";

export const getAuth = ({
	authHost,
	secret,
	trustedOrigins,
	crossDomain,
	db,
}: AuthBaseConfig) => {
	const baseConfig = getAuthBaseConfig({
		authHost,
		secret,
		trustedOrigins,
		crossDomain,
		db,
	});
	return betterAuth(baseConfig);
};
