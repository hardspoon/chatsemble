import { AppHeader } from "@/components/layout/app-header";

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<AppHeader />
			{children}
		</>
	);
}
