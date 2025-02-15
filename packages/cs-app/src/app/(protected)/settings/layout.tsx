import { AppHeader } from "@/components/layout/app-header";

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<AppHeader />
			<div className="container flex-1 space-y-4 p-8 pt-6">
				<div className="flex flex-col space-y-1">
					<h2 className="text-2xl font-bold tracking-tight">Settings</h2>
					<p className="text-muted-foreground">
						Manage your account settings and preferences.
					</p>
				</div>
				<div className="flex flex-col space-y-8">{children}</div>
			</div>
		</>
	);
}
