import { authClient } from "@/lib/auth-client";
import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
	component: Root,
});

function Root() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <div>Loading...</div>;
	}

	if (!session) {
		return <Navigate to="/auth/signin" />;
	}
	return <Outlet />;
}
