import { QueryProvider } from "@client/components/providers/query-provider";
import { ThemeProvider } from "@client/components/providers/theme-provider";
import { Toaster } from "@client/components/ui/sonner";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryProvider>
				<Toaster />
				<Outlet />
			</QueryProvider>
		</ThemeProvider>
	);
}
