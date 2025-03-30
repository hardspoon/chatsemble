import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

type SessionContextType = ReturnType<typeof authClient.useSession>["data"];

const SessionContext = createContext<SessionContextType>(null);

export function useSession() {
	return useContext(SessionContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = authClient.useSession();

	return (
		<SessionContext.Provider value={session}>
			{children}
		</SessionContext.Provider>
	);
}

export function useUser() {
	const session = useSession();

	if (!session) {
		throw new Error("User not found");
	}

	return session.user;
}
