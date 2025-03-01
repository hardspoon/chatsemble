import { getAuth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "./_components/create-organization-form";
export default async function CreateOrganizationPage() {
	const auth = getAuth();
	const headersList = await headers();
	const session = await auth.api.getSession({
		headers: headersList,
	});

	if (!session) {
		return redirect("/auth/login");
	}

	if (session.session.activeOrganizationId) {
		return redirect("/chat");
	}

	return (
		<div className="container mx-auto flex min-h-screen w-full flex-col items-center justify-center py-8">
			<CreateOrganizationForm user={session.user} />
		</div>
	);
}
