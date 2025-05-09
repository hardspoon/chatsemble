import { env } from "cloudflare:workers";
import { organizationPermissions } from "@server/auth/organization-permissions";
import { db } from "@server/db";
import * as globalSchema from "@server/db/schema";
import { sendMail } from "@server/email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import type { AuthenticationProvider, UserSession, RedirectResponse, SignInResponse } from './types';

export class AuthStrategyManager {
  private providers: Map<string, AuthenticationProvider> = new Map();

  constructor(initialProviders: AuthenticationProvider[] = []) {
    initialProviders.forEach(provider => {
      this.registerProvider(provider);
    });
  }

  registerProvider(provider: AuthenticationProvider): void {
    if (this.providers.has(provider.getName())) {
      console.warn(`Provider with name ${provider.getName()} is already registered. Overwriting.`);
    }
    this.providers.set(provider.getName(), provider);
  }

  getProvider(name: string): AuthenticationProvider | undefined {
    return this.providers.get(name);
  }

  // Example of how the manager might select a provider and authenticate
  // This will need to be adapted based on how providers are selected (e.g., request path, headers, config)
  async authenticateRequest(request: Request, providerName?: string): Promise<UserSession | null> {
    let providerToUse: AuthenticationProvider | undefined;

    if (providerName) {
      providerToUse = this.getProvider(providerName);
      if (!providerToUse) {
        console.error(`Authentication provider '${providerName}' not found.`);
        return null;
      }
    } else if (this.providers.size === 1) {
      // If only one provider, use it by default
      providerToUse = this.providers.values().next().value;
    } else if (this.providers.size > 1) {
      // TODO: Implement logic to select a provider if multiple are available and no specific one is requested.
      // This could be based on a default provider setting or other criteria.
      console.error("Multiple providers configured, but no specific provider requested or default set.");
      return null;
    }

    if (!providerToUse) {
      console.error("No authentication provider available to handle the request.");
      return null;
    }

    return providerToUse.authenticateRequest(request);
  }

  async initiateSignIn(request: Request, providerName: string): Promise<RedirectResponse | SignInResponse | null> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      console.error(`Authentication provider '${providerName}' not found for initiating sign-in.`);
      // Potentially throw an error or return a generic error response
      return null; 
    }
    return provider.initiateSignIn(request);
  }

  async handleCallback(request: Request, providerName: string): Promise<UserSession | null> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      console.error(`Authentication provider '${providerName}' not found for handling callback.`);
      // Potentially throw an error or return a generic error response
      return null;
    }
    return provider.handleCallback(request);
  }
  
  // TODO: Further methods to manage providers or select them based on context
}

// Example instantiation (this will be configured based on environment variables later)
// const authManager = new AuthStrategyManager();

// The existing 'auth' object might be refactored to be one of the providers 
// or the AuthStrategyManager might become the primary export.

export const auth = betterAuth({
	appName: "Chatsemble",
	baseURL: env.APP_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.APP_URL],
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendMail(user.email, "email-verification", {
				verificationUrl: url,
				username: user.email,
			});
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await sendMail(user.email, "password-reset", {
				resetLink: url,
				username: user.email,
			});
		},
	},
	plugins: [
		organization({
			ac: organizationPermissions.accessControl,
			roles: {
				member: organizationPermissions.member,
				admin: organizationPermissions.admin,
				owner: organizationPermissions.owner,
			},
			schema: {
				member: {
					modelName: "organizationMember",
				},
				invitation: {
					modelName: "organizationInvitation",
				},
			},
			sendInvitationEmail: async (data) => {
				const url = `${env.APP_URL}/auth/accept-invitation/${data.id}`;
				await sendMail(data.email, "organization-invitation", {
					inviteLink: url,
					username: data.email,
					invitedByUsername: data.inviter.user.name,
					invitedByEmail: data.inviter.user.email,
					teamName: data.organization.name,
				});
			},
		}),
	],
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const orgSession = await db.query.organizationMember.findFirst({
						where: eq(globalSchema.organizationMember.userId, session.userId),
					});
					return {
						data: {
							...session,
							activeOrganizationId: orgSession?.organizationId ?? null,
						},
					};
				},
			},
		},
	},
});