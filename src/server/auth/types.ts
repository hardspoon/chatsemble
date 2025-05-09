// /Users/GIT/agent/chatsemble/src/server/auth/types.ts

// Placeholder for UserSession. This should be aligned with the actual user session structure.
// It might be imported from a shared types location or defined more concretely later.
export interface UserSession {
  id: string; // Typically user ID
  email?: string;
  name?: string;
  // other session data
  [key: string]: any;
}

// Response type for redirection during sign-in
export interface RedirectResponse {
  type: 'redirect';
  url: string;
  status?: number; // e.g., 302
}

// Response type for direct sign-in data (e.g., token)
export interface SignInResponse {
  type: 'signIn';
  data: any; // Could be a token, user info, etc.
}

/**
 * Defines the contract for an authentication provider.
 * Each provider (e.g., Firebase, Better Auth) will implement this interface.
 */
export interface AuthenticationProvider {
  /**
   * Authenticates an incoming request.
   * @param request The incoming HTTP request. This should ideally be typed according to the web framework in use (e.g., Hono's Request).
   * @returns A Promise resolving to a UserSession if authentication is successful, otherwise null.
   */
  authenticateRequest(request: Request): Promise<UserSession | null>;

  /**
   * Initiates the sign-in process for the provider.
   * @param request The incoming HTTP request.
   * @returns A Promise resolving to a RedirectResponse (for redirect-based flows like OAuth) 
   *          or a SignInResponse (for API-based flows returning tokens/data directly).
   */
  initiateSignIn(request: Request): Promise<RedirectResponse | SignInResponse>;

  /**
   * Handles the callback from an external authentication provider (e.g., OAuth callback).
   * @param request The incoming HTTP request containing callback data (e.g., authorization code, tokens).
   * @returns A Promise resolving to a UserSession upon successful authentication and user processing.
   */
  handleCallback(request: Request): Promise<UserSession>;

  /**
   * Gets the unique name of the provider (e.g., 'firebase', 'better-auth').
   * This can be used for logging, configuration, or selecting a specific provider.
   * @returns The name of the provider as a string.
   */
  getName(): string;
}