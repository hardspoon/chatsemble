
```json
[
  {
    "id": 1,
    "title": "Setup Firebase Project and Configure Credentials",
    "description": "Create and configure a Firebase project, enable authentication providers (e.g., Google), and obtain all necessary credentials (API Key, Auth Domain, Project ID, Service Account JSON). This is a foundational step required for any Firebase integration development and testing.",
    "dependencies": [],
    "priority": "high",
    "implementation_notes": "1. Go to the Firebase console (console.firebase.google.com).\n2. Create a new project or select an existing one for Chatsemble.\n3. In the Authentication section, enable the desired sign-in methods (e.g., Google Sign-In). Ensure callback URLs/authorized domains are configured correctly for the Chatsemble application (localhost for dev, production URL for live).\n4. From Project settings, obtain `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`.\n5. Generate a new private key for a service account (Project settings > Service accounts) and download the JSON file. This will be used for `FIREBASE_SERVICE_ACCOUNT_JSON`.",
    "test_strategy": "Verification: Confirm that the Firebase project is created, Google Sign-In (or other chosen providers) is enabled, and all required API keys, project IDs, and the service account JSON are accessible and correctly noted. Attempting a basic client-side SDK initialization with the config locally can be a quick smoke test (though full functionality depends on later tasks).",
    "subtasks": [
      {
        "id": 1,
        "title": "Create Firebase Project",
        "description": "Navigate to the Firebase console and create a new project dedicated to Chatsemble or select an appropriate existing project.",
        "status": "in progress",
        "dependencies": [],
        "details": "Access console.firebase.google.com. Follow the prompts to create a new project, providing a suitable name (e.g., 'Chatsemble-App'). Note the Project ID generated.",
        "testStrategy": "Verify the project appears in the Firebase console dashboard. Confirm Project ID is recorded."
      },
      {
        "id": 2,
        "title": "Enable and Configure Firebase Authentication Providers",
        "description": "Within the Firebase project, navigate to the Authentication section. Enable Google Sign-In as a provider and configure any necessary OAuth settings, including redirect URIs for development (localhost) and production.",
        "status": "in progress",
        "dependencies": [1],
        "details": "In Firebase Console > Authentication > Sign-in method, enable 'Google'. Configure OAuth consent screen if prompted. Add authorized JavaScript origins and redirect URIs (e.g., `http://localhost:PORT` for dev, actual app URL for prod). Obtain `FIREBASE_API_KEY` and `FIREBASE_AUTH_DOMAIN` from Project Settings.",
        "testStrategy": "Confirm Google Sign-In is listed as enabled. Verify client ID and secret are generated (if applicable, usually handled by Firebase SDK). Confirm API Key and Auth Domain are recorded."
      },
      {
        "id": 3,
        "title": "Generate and Securely Store Service Account Credentials",
        "description": "Generate a service account key (JSON file) from the Firebase project settings for backend server-to-server authentication (Firebase Admin SDK). Securely store this JSON content.",
        "status": "completed",
        "completion_date": "2024-02-20",
        "dependencies": [1],
        "details": "In Firebase Console > Project settings > Service accounts, generate a new private key for the App Engine default service account or a new service account. Download the JSON file. The content of this file will be used for the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable/secret.",
        "testStrategy": "Verify the JSON key file is downloaded. Confirm the content of the JSON file is accessible and ready to be used as a secret."
      }
    ]
  },
  {
    "id": 2,
    "title": "Refactor Core Authentication for Multi-Provider Support",
    "description": "Modify existing authentication logic in `src/server/auth/index.ts` and `src/server/middleware/auth.ts` to support multiple authentication providers. This involves abstracting the current 'Better Auth' logic and preparing the system for new providers like Firebase. The goal is a pluggable architecture.",
    "dependencies": [],
    "priority": "high",
    "implementation_notes": "1. Analyze `src/server/auth/index.ts` and `src/server/middleware/auth.ts` to identify core authentication functions (e.g., user validation, session creation, request authentication).\n2. Design an `AuthenticationProvider` interface or abstract class with methods like `authenticateRequest(request): Promise<User | null>`, `handleSignIn(credentials): Promise<Session>`, etc.\n3. Implement a Strategy pattern where a central `AuthManager` or the middleware itself can select and use a specific `AuthenticationProvider` based on configuration or request parameters.\n4. Refactor the existing 'Better Auth' logic to implement this new `AuthenticationProvider` interface.\n5. Introduce environment variables (e.g., `ACTIVE_AUTH_PROVIDERS`) to control which providers are active and how they are configured. Update `wrangler.jsonc` and `.dev.vars` accordingly.\n6. Ensure existing tests for 'Better Auth' are adapted or rewritten to pass with the new abstraction layer in place.",
    "test_strategy": "Unit tests for the abstraction layer (interface, strategy selection). Integration tests to ensure 'Better Auth' still functions correctly through the new abstraction. Verify that the system can be configured to use only 'Better Auth' and it works as before. Test middleware to ensure requests are correctly routed to the active provider.",
    "subtasks": [
      {
        "id": 1,
        "title": "Design AuthenticationProvider Interface and Strategy Context",
        "description": "Define a TypeScript interface `AuthenticationProvider` in `src/server/auth/types.ts` (or similar) outlining common methods like `authenticateRequest(request): Promise<UserSession | null>`, `initiateSignIn(request): Promise<RedirectResponse | SignInResponse>`, and `handleCallback(request): Promise<UserSession>`. Design an `AuthStrategyManager` or context class in `src/server/auth/index.ts` to manage and delegate to different providers.",
        "status": "in progress",
        "dependencies": [],
        "details": "Interface methods should cover: verifying incoming requests for existing sessions, initiating a new sign-in flow (which might be a redirect or an API response), and handling callbacks from external providers. The Strategy Manager will hold instances of configured providers and select based on request or configuration.",
        "testStrategy": "Code review of the interface and strategy manager design. Unit tests for the `AuthStrategyManager`'s provider registration and selection logic (mocking providers)."
      },
      {
        "id": 2,
        "title": "Implement Environment Variable Configuration for Provider Selection",
        "description": "Develop logic to read environment variables (e.g., `AUTH_PROVIDERS_ENABLED`, `DEFAULT_AUTH_PROVIDER`) in `src/server/auth/index.ts` to determine which authentication providers are active and how they are initialized. This allows flexible configuration without code changes.",
        "status": "in progress",
        "dependencies": [1],
        "details": "Parse a comma-separated string for `AUTH_PROVIDERS_ENABLED` (e.g., 'better-auth,firebase'). The `AuthStrategyManager` will use this to instantiate and register only the enabled providers. Implement fallback to a default provider if multiple are enabled but no specific one is requested.",
        "testStrategy": "Unit tests: Verify correct provider initialization based on different environment variable settings. Test scenarios with one provider, multiple providers, and missing/invalid configurations."
      },
      {
        "id": 3,
        "title": "Adapt Existing 'Better Auth' to AuthenticationProvider Interface",
        "description": "Refactor the current 'Better Auth' implementation (logic from `src/server/auth/index.ts` and related files) into a new class `BetterAuthProvider` in `src/server/auth/providers/better-auth.ts` that implements the `AuthenticationProvider` interface.",
        "status": "in progress",
        "dependencies": [1],
        "details": "Move existing Better Auth specific logic into this new provider class. Ensure all functionalities (sign-up, sign-in, token validation) are mapped to the interface methods. This might involve minimal changes to Better Auth's core logic, focusing on wrapping it within the new interface structure.",
        "testStrategy": "Integration tests: Re-run existing 'Better Auth' tests, ensuring they pass when 'Better Auth' is used via the new `AuthStrategyManager` and `BetterAuthProvider` implementation. Focus on no regressions in functionality."
      },
      {
        "id": 4,
        "title": "Update Auth Middleware to Use Strategy Pattern",
        "description": "Modify the authentication middleware in `src/server/middleware/auth.ts` to use the `AuthStrategyManager`. The middleware should delegate authentication decisions and request handling to the appropriate active provider selected by the manager.",
        "status": "in progress",
        "dependencies": [1, 2, 3],
        "details": "The middleware will invoke `authStrategyManager.authenticateRequest(request)`. Depending on the request (e.g., specific path like `/auth/firebase/callback` or headers), the manager might select a specific provider, or use a default. Update how user sessions are attached to the request context (`request.user` or similar).",
        "testStrategy": "Integration tests for the middleware: Test requests with no auth, valid Better Auth session, and (later) valid Firebase session (once Firebase provider is added). Verify correct user object is attached to request or unauthenticated access is handled."
      },
      {
        "id": 5,
        "title": "Develop Unit and Integration Tests for Auth Abstraction",
        "description": "Create a comprehensive suite of unit and integration tests for the new authentication abstraction layer, strategy manager, and the adapted 'Better Auth' provider to ensure robustness and prevent regressions.",
        "status": "in progress",
        "dependencies": [1, 2, 3, 4],
        "details": "Unit tests should cover individual components like provider selection logic, interface method calls. Integration tests should cover end-to-end flows for 'Better Auth' through the new abstracted system. Use mocking for external dependencies where appropriate (e.g., database calls for Better Auth).",
        "testStrategy": "Achieve high test coverage (e.g., >80%) for all new and refactored authentication code. All tests must pass before considering this task complete."
      }
    ]
  },
  {
    "id": 3,
    "title": "Implement Firebase Authentication Strategy (Backend)",
    "description": "Create a new backend module (`src/server/auth/firebase-auth.ts` or `src/server/auth/providers/firebase.ts`) to handle Firebase ID token verification using the Firebase Admin SDK. This module will act as a specific authentication provider within the refactored core authentication system. It must be compatible with Cloudflare Workers.",
    "dependencies": ["Refactor Core Authentication for Multi-Provider Support"],
    "priority": "high",
    "implementation_notes": "1. Create the new file (e.g., `src/server/auth/providers/firebase.ts`).\n2. Add Firebase Admin SDK (`firebase-admin`) as a project dependency if its Cloudflare Workers compatibility is confirmed. Initialize the SDK with service account credentials (from `FIREBASE_SERVICE_ACCOUNT_JSON` env var).\n3. If `firebase-admin` is too heavy or incompatible with Workers, research and implement pure JWT validation for Firebase ID tokens (checking issuer, audience, signature against Firebase public keys).\n4. Implement the `AuthenticationProvider` interface methods. The key method will be verifying the Firebase ID token received from the client (e.g., `verifyIdToken(token): Promise<FirebaseDecodedIdToken>`).\n5. Handle errors gracefully (e.g., invalid token, expired token).\n6. Ensure this module can be registered and selected by the core authentication system.",
    "test_strategy": "Unit tests: Mock Firebase Admin SDK/JWT validation calls to test token verification logic, including valid, invalid, and expired tokens. Test error handling. Integration tests: Send actual (test) Firebase ID tokens to an endpoint protected by this strategy and verify successful authentication or appropriate error responses. Test Cloudflare Worker deployment and execution if using Admin SDK.",
    "subtasks": [
      {
        "id": 1,
        "title": "Setup Firebase Admin SDK or JWT Validation Library",
        "description": "Install and configure the Firebase Admin SDK (`firebase-admin`) in `src/server/auth/providers/firebase.ts`. If Admin SDK is unsuitable for Cloudflare Workers, research and set up a lightweight JWT validation library for Firebase tokens.",
        "status": "completed",
        "completion_date": "2024-02-20",
        "dependencies": [],
        "details": "Add `firebase-admin` to `package.json`. Initialize it using `admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });`. If using pure JWT: install `jose` or similar. Fetch Firebase public keys from `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com` and cache them.",
        "testStrategy": "Verify SDK/library initializes without errors using environment variables locally. For JWT, verify public key fetching and parsing."
      },
      {
        "id": 2,
        "title": "Implement Firebase ID Token Verification Logic",
        "description": "Develop the function to verify Firebase ID tokens received from the client. This involves using `admin.auth().verifyIdToken(idToken)` or manually validating the JWT's signature, issuer, audience, and expiration.",
        "status": "in progress",
        "dependencies": [1],
        "details": "Create a method like `async verifyFirebaseToken(token: string): Promise<DecodedIdToken | null>`. Use `await admin.auth().verifyIdToken(token)`. Catch specific Firebase errors (e.g., `auth/id-token-expired`, `auth/argument-error`). For manual JWT, check `iss` against `https://securetoken.google.com/<PROJECT_ID>`, `aud` against `<PROJECT_ID>`, `exp`, and signature.",
        "testStrategy": "Unit test with mocked valid, invalid, expired tokens. Test against actual test tokens generated by client-side Firebase SDK if possible. Verify correct user information (UID, email) is extracted."
      },
      {
        "id": 3,
        "title": "Integrate Firebase Strategy with Core Auth System",
        "description": "Implement the `AuthenticationProvider` interface for the Firebase strategy (e.g., in `FirebaseAuthProvider` class). Register this provider with the `AuthStrategyManager`.",
        "status": "in progress",
        "dependencies": [2],
        "details": "The `FirebaseAuthProvider`'s `authenticateRequest` method would expect an ID token (e.g., Bearer token), call `verifyFirebaseToken`, and then proceed to user linking/creation. The `handleCallback` or `initiateSignIn` methods might be simpler for Firebase if client handles the full popup flow, mainly focusing on backend token verification.",
        "testStrategy": "Integration test: Ensure `AuthStrategyManager` can select and use `FirebaseAuthProvider` when configured. Test an API endpoint protected by this strategy end-to-end."
      },
      {
        "id": 4,
        "title": "Implement Error Handling for Firebase Token Validation",
        "description": "Ensure robust error handling for various Firebase token validation failures (e.g., expired, malformed, invalid signature, revoked session) and map them to appropriate HTTP error responses.",
        "status": "in progress",
        "dependencies": [2],
        "details": "Catch exceptions from `verifyIdToken` or manual validation steps. Log errors for debugging. Return clear HTTP 401 or 403 responses with appropriate error messages/codes for the client to interpret.",
        "testStrategy": "Unit tests for each specific error condition. Verify that client receives standardized error responses when sending problematic tokens."
      }
    ]
  },
  {
    "id": 4,
    "title": "Modify Database Schema for Firebase Integration",
    "description": "Update the D1 database schema (`src/server/db/schema/auth.ts`) to include new columns in the `users` table (and potentially `accounts` table) for storing Firebase-specific user identifiers like `firebase_uid`, `provider_user_id`, and `auth_provider_name`.",
    "dependencies": [],
    "priority": "high",
    "implementation_notes": "1. Edit `src/server/db/schema/auth.ts`.\n2. In the `users` table schema, add:\n   - `firebase_uid TEXT UNIQUE` (or appropriate type for unique Firebase User ID).\n   - `provider_user_id TEXT` (can store the Firebase UID again or a more specific provider ID if Firebase supports multiple sub-providers like Google, Facebook via Firebase itself).\n   - `auth_provider_name TEXT` (e.g., 'firebase', 'google.com' if distinguishing Firebase sub-providers).\n3. Consider if an `accounts` table linking multiple auth methods to a single user is more appropriate long-term than adding directly to `users`, but for now, PRD suggests `users` table modification.\n4. Create D1 migration scripts (`wrangler d1 migrations create ...`) to apply these schema changes.\n5. Ensure indices are added for `firebase_uid` for efficient lookups.",
    "test_strategy": "Run D1 migrations locally and verify the schema changes in a test database. Test inserting and querying data with the new columns. Ensure uniqueness constraints (like on `firebase_uid`) are enforced.",
    "subtasks": [
      {
        "id": 1,
        "title": "Define New Columns in User Table Schema",
        "description": "Edit `src/server/db/schema/auth.ts` to add `firebase_uid` (TEXT, UNIQUE, INDEXED), `provider_user_id` (TEXT), and `auth_provider_name` (TEXT) columns to the `users` table definition using Drizzle ORM or the relevant schema definition tool.",
        "status": "in progress",
        "dependencies": [],
        "details": "Example using Drizzle ORM: `firebase_uid: text('firebase_uid').unique(), provider_user_id: text('provider_user_id'), auth_provider_name: text('auth_provider_name')`. Ensure `firebase_uid` is indexed for fast lookups.",
        "testStrategy": "Review the schema definition file for correctness. Static analysis or type checking of the schema definition."
      },
      {
        "id": 2,
        "title": "Create D1 Migration Scripts",
        "description": "Generate D1 migration SQL scripts using `wrangler d1 migrations create chatsemble_db add_firebase_user_fields` (or similar command) to reflect the schema changes. Review and adjust the generated SQL if necessary.",
        "status": "completed",
        "completion_date": "2024-02-20",
        "dependencies": [1],
        "details": "Run the wrangler command. Inspect the generated `.sql` file. It should contain `ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE;` etc. Add `CREATE INDEX IF NOT EXISTS idx_firebase_uid ON users(firebase_uid);` if not automatically handled by ORM for unique constraint.",
        "testStrategy": "Validate the SQL syntax in the migration file. Ensure it's non-destructive for existing data (though these are new columns)."
      },
      {
        "id": 3,
        "title": "Apply and Test Migrations Locally",
        "description": "Run the D1 migrations on a local development database using `wrangler d1 migrations apply chatsemble_db --local`. Verify the `users` table structure is updated correctly and test inserting/querying data with the new columns.",
        "status": "in progress",
        "dependencies": [2],
        "details": "After applying, connect to the local D1 DB and inspect the `users` table schema. Attempt to insert a row with a `firebase_uid` and then another with the same `firebase_uid` to test uniqueness. Query by `firebase_uid`.",
        "testStrategy": "Confirm schema changes via `PRAGMA table_info(users);` or similar. Test CRUD operations involving the new fields. Ensure uniqueness constraint on `firebase_uid` works as expected."
      }
    ]
  },
  {
    "id": 5,
    "title": "Implement User Management and Account Linking (Backend)",
    "description": "Develop backend logic to create a new Chatsemble user in D1 or link a Firebase authentication to an existing user profile upon successful Firebase ID token verification. This involves interacting with the D1 database using the updated schema.",
    "dependencies": ["Implement Firebase Authentication Strategy (Backend)", "Modify Database Schema for Firebase Integration"],
    "priority": "high",
    "implementation_notes": "1. After successful Firebase ID token verification in `firebase-auth.ts`, extract user information (UID, email, display name, photo URL) from the decoded token.\n2. Implement logic to check if a user with this `firebase_uid` already exists in the `users` table.\n3. If user exists, update their profile if necessary (e.g., display name, photo URL) and proceed to session creation.\n4. If user does not exist, create a new record in the `users` table, populating `firebase_uid`, `email` (if available and verified), `provider_user_id`, `auth_provider_name`, and other relevant fields.\n5. The session management (e.g., creating a Chatsemble session token) will then use the Chatsemble internal user ID. The PRD suggests existing session management might be reused.\n6. Ensure atomicity if checking and creating users to prevent race conditions, though D1's nature might simplify this. Consider `INSERT ... ON CONFLICT` if applicable for D1.",
    "test_strategy": "Unit tests for user creation and linking logic (mocking DB calls). Integration tests: \n   a) Authenticate with a new Firebase user; verify a new Chatsemble user is created in D1 with correct Firebase details.\n   b) Authenticate with the same Firebase user again; verify no new user is created, and the existing user is identified.\n   c) Verify session establishment for Firebase-authenticated users.",
    "subtasks": [
      {
        "id": 1,
        "title": "Implement Find User by firebase_uid Logic",
        "description": "Create a database query function to find an existing Chatsemble user by their `firebase_uid` in the `users` table.",
        "status": "in progress",
        "dependencies": [],
        "details": "In the user service or repository layer, add a method like `async findUserByFirebaseUid(firebaseUid: string): Promise<User | null>`. This will execute a D1 query: `SELECT * FROM users WHERE firebase_uid = ?`.",
        "testStrategy": "Unit test this function by mocking the D1 database call, testing cases where user is found and not found."
      },
      {
        "id": 2,
        "title": "Implement Create New User with Firebase Details",
        "description": "Develop logic to insert a new user record into the Chatsemble `users` table using details from the verified Firebase ID token (UID, email, name, photoURL) and setting `auth_provider_name` to 'firebase'.",
        "status": "in progress",
        "dependencies": [],
        "details": "Create a method `async createUserWithFirebase(decodedToken: DecodedIdToken): Promise<User>`. This will map Firebase token fields (e.g., `decodedToken.uid` to `firebase_uid`, `decodedToken.email` to `email`) to the Chatsemble user schema and insert into D1. Return the newly created Chatsemble user object.",
        "testStrategy": "Unit test by mocking D1 insert. Verify all relevant fields are correctly mapped and inserted. Test with minimal and complete Firebase token data."
      },
      {
        "id": 3,
        "title": "Orchestrate User Linking/Creation Flow",
        "description": "In the `FirebaseAuthProvider`, after token verification, use the `findUserByFirebaseUid` function. If user exists, use that user. If not, use `createUserWithFirebase` to create them. Update user profile (name, photo) if existing user found and Firebase data is newer.",
        "status": "in progress",
        "dependencies": [1, 2],
        "details": "This logic forms the core of `FirebaseAuthProvider`'s responsibility after token validation. Handle potential updates to existing user's display name or photo URL if they've changed in Firebase. This logic ensures a Chatsemble user record is associated with the Firebase login.",
        "testStrategy": "Integration test this flow: 1. New Firebase user signs in -> new Chatsemble user created. 2. Same Firebase user signs in again -> existing Chatsemble user is retrieved, no new user created. 3. Firebase user updates profile, signs in -> Chatsemble profile reflects changes (if implemented)."
      },
      {
        "id": 4,
        "title": "Establish Chatsemble Session for Firebase User",
        "description": "After a Chatsemble user (either found or newly created) is identified for the Firebase login, utilize the existing or a common session management mechanism to create and return a Chatsemble session for this user.",
        "status": "in progress",
        "dependencies": [3],
        "details": "This step involves taking the Chatsemble user ID and invoking the common session creation logic (e.g., generating a JWT or session cookie for Chatsemble, not Firebase). The response to the client will contain this Chatsemble session token.",
        "testStrategy": "Verify that after a successful Firebase login and user linking/creation, a valid Chatsemble session token is generated and can be used for subsequent authenticated requests to Chatsemble APIs."
      }
    ]
  },
  {
    "id": 6,
    "title": "Configure Environment Variables for Firebase",
    "description": "Add necessary Firebase-related environment variables to configuration files (`wrangler.jsonc`, `.dev.vars`) and set up secrets for sensitive information like the service account JSON.",
    "dependencies": ["Setup Firebase Project and Configure Credentials"],
    "priority": "high",
    "implementation_notes": "1. In `wrangler.jsonc` (for deployed environments) and `.dev.vars` (for local development), add:\n   - `FIREBASE_API_KEY`\n   - `FIREBASE_AUTH_DOMAIN`\n   - `FIREBASE_PROJECT_ID`\n2. For `FIREBASE_SERVICE_ACCOUNT_JSON`, this is sensitive. Use `wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON` to store it as a secret in Cloudflare Workers. For local development (`.dev.vars`), you can store the JSON string directly or a path to the file (though the PRD implies the string itself).\n3. Ensure the backend Firebase Admin SDK initialization logic correctly reads these environment variables/secrets.",
    "test_strategy": "Locally, verify that the backend can initialize the Firebase Admin SDK (if used) or access necessary config values when running `wrangler dev`. For deployed environment, verify after deployment that the worker starts without errors related to Firebase config and can perform Firebase operations.",
    "subtasks": [
      {
        "id": 1,
        "title": "Update wrangler.jsonc and .dev.vars",
        "description": "Add `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID` variables to the `[vars]` section of `wrangler.jsonc` and to the `.dev.vars` file with their respective values obtained from Firebase project setup.",
        "status": "in progress",
        "dependencies": [],
        "details": "Example for `.dev.vars`:\n`FIREBASE_API_KEY=\"AIzaSy...\"\nFIREBASE_AUTH_DOMAIN=\"project-id.firebaseapp.com\"\nFIREBASE_PROJECT_ID=\"project-id\"`\nSimilar entries in `wrangler.jsonc`.",
        "testStrategy": "Check file contents. Run `wrangler dev` and verify the application can access these variables (e.g., via logging them out during startup if appropriate, or by Firebase SDKs using them)."
      },
      {
        "id": 2,
        "title": "Store FIREBASE_SERVICE_ACCOUNT_JSON as Wrangler Secret",
        "description": "Use the `wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON` command to securely store the content of the downloaded service account JSON file as a secret for the deployed Cloudflare Worker. For `.dev.vars`, add the JSON string directly.",
        "status": "in progress",
        "dependencies": [],
        "details": "For `wrangler secret put`, you might need to pipe the content: `cat path/to/serviceAccountKey.json | wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON`. In `.dev.vars`: `FIREBASE_SERVICE_ACCOUNT_JSON='{\"type\": \"service_account\", ...}'` (ensure proper escaping if JSON is complex).",
        "testStrategy": "Confirm `wrangler secret list` shows `FIREBASE_SERVICE_ACCOUNT_JSON`. Locally, ensure the backend can parse this JSON string from `.dev.vars` and initialize Firebase Admin SDK."
      },
      {
        "id": 3,
        "title": "Verify Application Access to Firebase Variables",
        "description": "Ensure that both client-side (for public keys) and server-side (for Admin SDK) logic can correctly access and utilize these newly configured Firebase environment variables and secrets.",
        "status": "in progress",
        "dependencies": [1, 2],
        "details": "Client-side variables (`FIREBASE_API_KEY`, etc.) might need to be exposed via an API endpoint or build-time injection. Server-side `FIREBASE_SERVICE_ACCOUNT_JSON` should be read by Firebase Admin SDK initialization logic. Add logging during initialization for verification.",
        "testStrategy": "Start the application locally (`wrangler dev`). Check logs for successful Firebase Admin SDK initialization. On the client, verify Firebase client SDK initializes. Deploy to a staging environment and re-verify."
      }
    ]
  },
  {
    "id": 7,
    "title": "Integrate Client-Side Firebase SDK",
    "description": "Update `src/client/lib/auth-client.ts` or create a new Firebase-specific client module to integrate the Firebase Authentication SDK for client-side sign-in flows (e.g., Google Sign-In). Implement conditional logic if multiple auth methods are supported.",
    "dependencies": ["Setup Firebase Project and Configure Credentials"],
    "priority": "high",
    "implementation_notes": "1. Add the Firebase client SDK (`firebase/auth`) as a frontend dependency.\n2. Initialize the Firebase app in the client (`src/client/lib/auth-client.ts` or a new file) using `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID` (these might need to be exposed to the client, e.g., via an API endpoint or build-time environment variables if safe).\n3. Implement functions to trigger Firebase sign-in flows, e.g., `signInWithGoogle()` using `signInWithPopup` or `signInWithRedirect` from the Firebase SDK.\n4. Implement logic to observe authentication state changes (`onAuthStateChanged`) to manage user session on the client-side and obtain the ID token upon successful sign-in.\n5. If 'Better Auth' is to be supported simultaneously, implement a mechanism to select or present multiple auth options.",
    "test_strategy": "Unit tests for client-side Firebase SDK wrapper functions (mocking Firebase SDK). Manual E2E testing: Trigger Google Sign-In from the client; verify the Firebase popup appears, user can sign in, and the client receives an auth state change and can access user info/ID token from Firebase.",
    "subtasks": [
      {
        "id": 1,
        "title": "Install and Initialize Firebase Client SDK",
        "description": "Add `firebase` package (specifically `firebase/app` and `firebase/auth`) as a frontend dependency. Initialize the Firebase app in `src/client/lib/auth-client.ts` using the project's Firebase configuration (API key, auth domain, project ID).",
        "status": "in progress",
        "dependencies": [],
        "details": "Run `npm install firebase` or `yarn add firebase`. In `auth-client.ts`:\n`import { initializeApp } from 'firebase/app';\nimport { getAuth } from 'firebase/auth';\nconst firebaseConfig = { apiKey: '...', authDomain: '...', projectId: '...' };\nconst app = initializeApp(firebaseConfig);\nexport const auth = getAuth(app);`\nThese config values need to be securely provided to the client (e.g., via environment variables exposed during build or fetched from a backend endpoint).",
        "testStrategy": "Verify the app compiles. Check browser console for successful Firebase initialization logs if any, or lack of errors. Confirm `auth` object is usable."
      },
      {
        "id": 2,
        "title": "Implement Firebase Sign-In Functions",
        "description": "Create functions (e.g., `signInWithGooglePopup()`) in `auth-client.ts` that use the Firebase SDK to initiate sign-in flows (e.g., `signInWithPopup` with `GoogleAuthProvider`).",
        "status": "in progress",
        "dependencies": [1],
        "details": "`import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';\nconst provider = new GoogleAuthProvider();\nexport async function signInWithGoogle() { try { const result = await signInWithPopup(auth, provider); return result.user; } catch (error) { console.error(error); throw error; } }`",
        "testStrategy": "Unit test these functions by mocking `signInWithPopup`. Manually test by calling these functions from the browser console and verifying the Google Sign-In popup appears."
      },
      {
        "id": 3,
        "title": "Implement onAuthStateChanged Listener for ID Token",
        "description": "Set up an `onAuthStateChanged` listener from the Firebase Auth SDK to react to user sign-in/sign-out events. When a user signs in, obtain their Firebase ID token using `user.getIdToken()`.",
        "status": "in progress",
        "dependencies": [1],
        "details": "`import { onAuthStateChanged } from 'firebase/auth';\nonAuthStateChanged(auth, async (user) => { if (user) { const idToken = await user.getIdToken(); /* store token, send to backend */ } else { /* handle sign-out */ } });`\nThis listener should be set up early in the app lifecycle.",
        "testStrategy": "Verify listener fires on sign-in and sign-out. Check that `idToken` is correctly retrieved. Test token refresh scenarios if applicable (Firebase handles this mostly)."
      },
      {
        "id": 4,
        "title": "Securely Expose Firebase Client Configuration",
        "description": "Determine and implement a secure method to provide `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID` to the client-side Firebase SDK initialization logic.",
        "status": "in progress",
        "dependencies": [1],
        "details": "Options: \n1. Vite/Webpack build-time environment variables (e.g., `VITE_FIREBASE_API_KEY`).\n2. Fetching from a dedicated backend API endpoint `/api/config/firebase-client` on app load.\nAvoid hardcoding directly in version-controlled source if keys are sensitive (though client keys are generally considered public).",
        "testStrategy": "Verify client app initializes Firebase SDK correctly using the exposed config, both locally and in deployed environments. Ensure no overly sensitive data is exposed if using an API endpoint."
      }
    ]
  },
  {
    "id": 8,
    "title": "Update Sign-In Page UI for Firebase Auth",
    "description": "Modify the sign-in page (`src/client/routes/auth/signin.tsx`) to include UI elements for Firebase Authentication, such as a 'Sign in with Google' button, that triggers the client-side Firebase SDK flow.",
    "dependencies": ["Integrate Client-Side Firebase SDK"],
    "priority": "medium",
    "implementation_notes": "1. Edit `src/client/routes/auth/signin.tsx`.\n2. Add a new button, e.g., `<button onClick={handleFirebaseSignIn}>Sign in with Google</button>`.\n3. The `handleFirebaseSignIn` function should call the appropriate method from the Firebase client-side auth module (developed in 'Integrate Client-Side Firebase SDK' task) to initiate the sign-in process.\n4. Ensure appropriate loading states and error messages are displayed in the UI during the Firebase sign-in flow.\n5. Style the button to be consistent with the application's design.",
    "test_strategy": "Visual inspection of the sign-in page to confirm the new button is present and correctly styled. Functional testing: Click the button and verify it initiates the Firebase Google Sign-In flow. Test UI feedback for loading and error states.",
    "subtasks": [
      {
        "id": 1,
        "title": "Add 'Sign in with Google' Button",
        "description": "In `src/client/routes/auth/signin.tsx`, add a new button element (e.g., `<button>Sign in with Google</button>`) or a similar UI component for initiating Firebase Google Sign-In.",
        "status": "in progress",
        "dependencies": [],
        "details": "Use appropriate HTML/React JSX for the button. Style it according to Chatsemble's design system. Ensure it has a clear label.",
        "testStrategy": "Visually inspect the sign-in page to confirm the button is rendered correctly and is accessible (ARIA attributes if needed)."
      },
      {
        "id": 2,
        "title": "Connect Button to Firebase Sign-In Logic",
        "description": "Wire the `onClick` event of the new button to call the `signInWithGooglePopup()` (or similar) function from the `auth-client.ts` module.",
        "status": "in progress",
        "dependencies": [1],
        "details": "Import the sign-in function. Example: `const handleGoogleSignIn = async () => { try { setIsLoading(true); await signInWithGoogle(); /* further redirect/UI update handled by onAuthStateChanged */ } catch (error) { setError('Failed to sign in with Google.'); } finally { setIsLoading(false); } };` Attach this to the button's `onClick`.",
        "testStrategy": "Click the button. Verify the Firebase Google Sign-In popup/redirect flow is initiated. Check browser console for errors."
      },
      {
        "id": 3,
        "title": "Implement UI Feedback for Sign-In Process",
        "description": "Add loading indicators (e.g., spinner on the button) while the Firebase sign-in process is active and display error messages in the UI if the sign-in fails.",
        "status": "in progress",
        "dependencies": [2],
        "details": "Use component state (e.g., `isLoading`, `error`) to conditionally render loading states or error messages near the sign-in button or in a notification area. Clear errors on subsequent attempts.",
        "testStrategy": "Test successful sign-in: verify loading state appears and disappears. Test failed sign-in (e.g., close popup prematurely, network error): verify error message is shown appropriately."
      }
    ]
  },
  {
    "id": 9,
    "title": "Implement Client-Side Firebase ID Token Handling",
    "description": "After successful client-side Firebase sign-in, obtain the Firebase ID token and securely send it to the Chatsemble backend API for verification and to establish a Chatsemble user session.",
    "dependencies": ["Integrate Client-Side Firebase SDK", "Implement Firebase Authentication Strategy (Backend)"],
    "priority": "high",
    "implementation_notes": "1. Within the `onAuthStateChanged` listener or after a successful `signInWithPopup/Redirect` promise resolves in the client-side Firebase auth logic:\n   - Get the Firebase ID token using `user.getIdToken()`.\n2. Implement a function to send this ID token to a specific Chatsemble backend endpoint (e.g., `/api/auth/firebase/signin`).\n3. Use a secure method (e.g., POST request with the token in the Authorization header as a Bearer token or in the request body over HTTPS).\n4. Handle the backend's response: on success, establish the Chatsemble session on the client (e.g., store session token, update UI); on failure, display an error message.",
    "test_strategy": "Unit tests for the token sending logic (mocking `fetch` or `axios`). Integration testing: After a successful client-side Firebase sign-in, verify the ID token is sent to the backend. Monitor network requests to confirm token transmission. Verify the client correctly handles success (e.g., redirect to dashboard, session storage) and error responses from the backend.",
    "subtasks": [
      {
        "id": 1,
        "title": "Retrieve Firebase ID Token on Client",
        "description": "Ensure the Firebase ID token is reliably retrieved using `user.getIdToken()` after a successful Firebase authentication event (e.g., within the `onAuthStateChanged` callback when `user` is present).",
        "status": "in progress",
        "dependencies": [],
        "details": "This is typically done inside the `onAuthStateChanged` listener as shown in 'Integrate Client-Side Firebase SDK' task (subtask 3). Store this token temporarily for sending to the backend.",
        "testStrategy": "Log the retrieved ID token to the console during testing to verify it's a valid JWT string. Check for errors during `getIdToken()` call."
      },
      {
        "id": 2,
        "title": "Send ID Token to Chatsemble Backend API",
        "description": "Implement a function to make a POST request to a Chatsemble backend endpoint (e.g., `/api/auth/firebase/verify`) sending the Firebase ID token in the `Authorization: Bearer <ID_TOKEN>` header or request body.",
        "status": "in progress",
        "dependencies": [1],
        "details": "Example using `fetch`:\n`async function sendTokenToBackend(idToken) { const response = await fetch('/api/auth/firebase/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer ${idToken}\` } }); if (!response.ok) throw new Error('Backend verification failed'); return response.json(); /* e.g. Chatsemble session token */ }`",
        "testStrategy": "Unit test with mocked `fetch`. Manually trigger this function after Firebase sign-in and monitor browser network tab to ensure the request is made correctly with the token. Check backend logs for token receipt."
      },
      {
        "id": 3,
        "title": "Handle Backend Response and Manage Chatsemble Session",
        "description": "Process the backend's response. On success (e.g., 200 OK with Chatsemble session token), store the Chatsemble session token (e.g., in localStorage/sessionStorage or httpOnly cookie if set by backend) and update UI/redirect. On failure, display an appropriate error to the user.",
        "status": "in progress",
        "dependencies": [2],
        "details": "If backend returns a Chatsemble session token, store it. Update application state to reflect authenticated status (e.g., using a global state manager like Zustand or Redux). Redirect to a protected route. If backend returns an error, display it.",
        "testStrategy": "Test successful backend verification: ensure Chatsemble session token is stored, user is redirected. Test backend verification failure: ensure error is displayed and user is not considered logged into Chatsemble."
      }
    ]
  }
]
```