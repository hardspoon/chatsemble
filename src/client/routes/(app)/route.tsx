import { AuthProvider } from "@client/components/providers/auth-provider";
import { SidebarProvider } from "@client/components/ui/sidebar";
import { authClient } from "@client/lib/auth-client";
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

	return (
		<AuthProvider>
			<SidebarProvider>
				<Outlet />
			</SidebarProvider>
		</AuthProvider>
	);
}
