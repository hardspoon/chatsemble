import { OrganizationConnectionProvider } from "@client/components/organization/organization-connection-provider";
import { AuthProvider } from "@client/components/providers/auth-provider";
import { SidebarProvider } from "@client/components/ui/sidebar";
import { authClient } from "@client/lib/auth-client";
import {
	Navigate,
	Outlet,
	createFileRoute,
	useSearch,
} from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
	component: Root,
});

function Root() {
	const { data, isPending } = authClient.useSession();

	const searchParams = useSearch({ strict: false });

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
				roomId={searchParams.roomId}
				threadId={searchParams.threadId}
				user={data.user}
			>
				<SidebarProvider>
					<Outlet />
				</SidebarProvider>
			</OrganizationConnectionProvider>
		</AuthProvider>
	);
}
