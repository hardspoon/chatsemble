import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<QueryProvider>
			<Toaster />
			<Outlet />
			<TanStackRouterDevtools />
		</QueryProvider>
	);
}
