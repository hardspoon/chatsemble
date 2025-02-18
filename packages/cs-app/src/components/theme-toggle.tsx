"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

export const ThemeToggle = ({ className, ...props }: ButtonProps) => {
	const { theme, setTheme } = useTheme();

	const toggleTheme = useCallback(() => {
		setTheme(theme === "light" ? "dark" : "light");
	}, [theme, setTheme]);

	return (
		<Button
			variant="ghost"
			className={cn("group/toggle h-8 w-8 px-0", className)}
			onClick={toggleTheme}
			{...props}
		>
			<SunIcon className="hidden [html.dark_&]:block" />
			<MoonIcon className="hidden [html.light_&]:block" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
};
