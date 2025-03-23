import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader({ children }: React.ComponentProps<"div">) {
	return (
		<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				{children}
			</div>
		</header>
	);
}

export function AppHeaderTitle({ children }: React.ComponentProps<"span">) {
	return (
		<span className="text-lg font-medium flex items-center gap-3 [&_svg]:size-5">
			{children}
		</span>
	);
}
