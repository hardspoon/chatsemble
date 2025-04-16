import { OrganizationConnectionProvider } from "@client/components/organization/organization-connection-provider";
import { AuthProvider } from "@client/components/providers/auth-provider";
import { SidebarProvider } from "@client/components/ui/sidebar";
import { authClient } from "@client/lib/auth-client";
import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
	component: Root,
});

function Root() {
	const { data, isPending } = authClient.useSession();

	if (isPending) {
		return <div>Loading...</div>; // TODO: Add a loading state
	}

	if (!data || !data.session) {
		return <Navigate to="/auth/signin" />;
	}

	if (!data.session.activeOrganizationId) {
		// TODO: Redirect to the organization selection page
		return <Navigate to="/auth/signin" />;
	}

	return (
		<AuthProvider>
			<OrganizationConnectionProvider
				organizationSlug={data.session.activeOrganizationId} // TODO: Make this be the slug instead of the ID???
			>
				<SidebarProvider>
					<Outlet />
				</SidebarProvider>
			</OrganizationConnectionProvider>
		</AuthProvider>
	);
}
