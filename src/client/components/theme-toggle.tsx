"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";
import { SidebarMenuButton } from "./ui/sidebar";

export const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();

	const toggleTheme = useCallback(() => {
		setTheme(theme === "light" ? "dark" : "light");
	}, [theme, setTheme]);

	return (
		<SidebarMenuButton tooltip="Toggle theme" size="sm" onClick={toggleTheme}>
			<SunIcon className="hidden [html.dark_&]:block" />
			<MoonIcon className="hidden [html.light_&]:block" />
			<span>Toggle theme</span>
		</SidebarMenuButton>
	);
};
