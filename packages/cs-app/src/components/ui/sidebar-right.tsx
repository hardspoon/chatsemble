"use client";

import { PanelLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE_NAME = "sidebar_right_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "30rem";
const SIDEBAR_WIDTH_MOBILE = "22rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarRightContext = {
	state: "expanded" | "collapsed";
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

const SidebarRightContext = React.createContext<SidebarRightContext | null>(
	null,
);

function useSidebarRight() {
	const context = React.useContext(SidebarRightContext);
	if (!context) {
		throw new Error(
			"useSidebarSimple must be used within a SidebarSimpleProvider.",
		);
	}

	return context;
}

const SidebarRightProvider = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<"div"> & {
		defaultOpen?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}
>(
	(
		{
			defaultOpen = true,
			open: openProp,
			onOpenChange: setOpenProp,
			children,
			className,
			style,
			...props
		},
		ref,
	) => {
		const isMobile = useIsMobile();
		const [openMobile, setOpenMobile] = React.useState(false);

		// This is the internal state of the sidebar.
		// We use openProp and setOpenProp for control from outside the component.
		const [_open, _setOpen] = React.useState(defaultOpen);
		const open = openProp ?? _open;
		const setOpen = React.useCallback(
			(value: boolean | ((value: boolean) => boolean)) => {
				const openState = typeof value === "function" ? value(open) : value;
				if (setOpenProp) {
					setOpenProp(openState);
				} else {
					_setOpen(openState);
				}

				// This sets the cookie to keep the sidebar state.
				document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
			},
			[setOpenProp, open],
		);

		// Helper to toggle the sidebar.
		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		const toggleSidebar = React.useCallback(() => {
			return isMobile
				? setOpenMobile((open) => !open)
				: setOpen((open) => !open);
		}, [isMobile, setOpen, setOpenMobile]);

		// Adds a keyboard shortcut to toggle the sidebar.
		React.useEffect(() => {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (
					event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
					(event.metaKey || event.ctrlKey)
				) {
					event.preventDefault();
					toggleSidebar();
				}
			};

			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}, [toggleSidebar]);

		// We add a state so that we can do data-state="expanded" or "collapsed".
		// This makes it easier to style the sidebar with Tailwind classes.
		const state = open ? "expanded" : "collapsed";

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		const contextValue = React.useMemo<SidebarRightContext>(
			() => ({
				state,
				open,
				setOpen,
				isMobile,
				openMobile,
				setOpenMobile,
				toggleSidebar,
			}),
			[
				state,
				open,
				setOpen,
				isMobile,
				openMobile,
				setOpenMobile,
				toggleSidebar,
			],
		);

		return (
			<SidebarRightContext.Provider value={contextValue}>
				<div
					style={
						{
							"--sidebar-simple-width": SIDEBAR_WIDTH,
							...style,
						} as React.CSSProperties
					}
					className={cn(
						"group/sidebar-wrapper flex min-h-svh h-svh w-full",
						className,
					)}
					ref={ref}
					{...props}
				>
					{children}
				</div>
			</SidebarRightContext.Provider>
		);
	},
);
SidebarRightProvider.displayName = "SidebarRightProvider";

const SidebarRight = React.forwardRef<
	HTMLDivElement,
	React.ComponentProps<"div"> & {
		side?: "left" | "right";
	}
>(({ side = "right", className, children, ...props }, ref) => {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebarRight();

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
				<SheetContent
					data-sidebar="sidebar"
					data-mobile="true"
					className="w-[--sidebar-simple-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
					style={
						{
							"--sidebar-simple-width": SIDEBAR_WIDTH_MOBILE,
						} as React.CSSProperties
					}
					side={side}
				>
					<div className="flex h-full w-full flex-col">{children}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			ref={ref}
			style={
				{
					"--sidebar-simple-width": SIDEBAR_WIDTH,
				} as React.CSSProperties
			}
			className={cn(
				"hidden h-full flex-shrink-0 transition-all duration-200 ease-linear bg-sidebar text-sidebar-foreground overflow-hidden md:flex",
				side === "left" ? "border-r" : "border-l",
				state === "expanded" ? "w-[--sidebar-simple-width]" : "w-0",
				className,
			)}
			data-state={state}
			{...props}
		>
			<div
				data-sidebar="sidebar"
				className="flex h-full w-[--sidebar-simple-width] flex-col"
			>
				{children}
			</div>
		</div>
	);
});
SidebarRight.displayName = "SidebarRight";

const SidebarRightTrigger = React.forwardRef<
	React.ElementRef<typeof Button>,
	React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
	const { toggleSidebar } = useSidebarRight();

	return (
		<Button
			ref={ref}
			data-sidebar="trigger"
			variant="ghost"
			size="icon"
			className={cn("h-7 w-7", className)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeft />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	);
});
SidebarRightTrigger.displayName = "SidebarSimpleTrigger";

export {
	SidebarRight,
	SidebarRightProvider,
	SidebarRightTrigger,
	useSidebarRight,
};
