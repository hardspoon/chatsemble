import { Separator } from "@/components/ui/separator";
import { OrganizationForm } from "./_components/organization-form";
import { getAuth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
	]).catch((e) => {
		console.log(e);
		throw redirect("/sign-in");
	});

	if (!session || !organization) {
		throw new Error("Failed to fetch session or organization");
	}

	return (
		<div className="space-y-4">
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
