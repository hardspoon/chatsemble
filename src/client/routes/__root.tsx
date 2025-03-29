import { QueryProvider } from "@/components/providers/query-provider";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<QueryProvider>
			<Outlet />
			<TanStackRouterDevtools />
		</QueryProvider>
	);
}
