import { getAuth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InvitationForm } from "./_components/invitation-form";

export default async function AcceptInvitationPage({
	params,
}: {
	params: { id: string };
}) {
	const auth = getAuth();
	const headersList = await headers();

	const invitation = await auth.api.getInvitation({
		headers: headersList,
		query: {
			id: params.id,
		},
	});

	if (!invitation) {
		return redirect("/auth/login");
	}

	const session = await auth.api.getSession({
		headers: headersList,
	});

	if (!session) {
		return redirect(
			`/auth/signup?invitationId=${params.id}&email=${invitation.email}`,
		);
	}

	return <InvitationForm invitationId={params.id} />;
}
