import { getAuth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OrganizationForm } from "./_components/organization-form";

const SettingsOrganizationPage = async () => {
	const auth = getAuth();
	const headersList = await headers();
	const [session, organization] = await Promise.all([
		auth.api.getSession({
			headers: headersList,
		}),
		auth.api.getFullOrganization({
			headers: headersList,
		}),
	]).catch(() => {
		throw redirect("/sign-in");
	});

	if (!session || !organization) {
		throw new Error("Failed to fetch session or organization");
	}

	return (
		<div className="space-y-4 p-8 pt-6">
			<div>
				<h3 className="text-lg font-medium">Organization</h3>
				<p className="text-sm text-muted-foreground">
					Manage your organization settings and members.
				</p>
			</div>
			<Separator />
			<OrganizationForm session={session} activeOrganization={organization} />
		</div>
	);
};

export default SettingsOrganizationPage;
