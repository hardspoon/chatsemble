"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { InvitationError } from "./invitation-error";

export function InvitationForm({ invitationId }: { invitationId: string }) {
	const router = useRouter();

	const {
		data: invitation,
		isLoading,
		error: invitationError,
	} = useQuery({
		queryKey: ["invitation", invitationId],
		queryFn: async () => {
			const res = await authClient.organization.getInvitation({
				query: { id: invitationId },
			});
			if (res.error) {
				throw new Error(res.error.message);
			}

			return res.data;
		},
	});

	const { mutate: acceptInvitation, error: acceptInvitationError } =
		useMutation({
			mutationFn: async () => {
				const res = await authClient.organization.acceptInvitation({
					invitationId: invitationId,
				});
				if (res.error) {
					throw new Error(res.error.message);
				}
				return res.data;
			},
			onSuccess: () => {
				router.push("/chat");
			},
		});

	const { mutate: rejectInvitation, error: rejectInvitationError } =
		useMutation({
			mutationFn: async () => {
				const res = await authClient.organization.rejectInvitation({
					invitationId: invitationId,
				});
				if (res.error) {
					throw new Error(res.error.message);
				}
				return res.data;
			},
			onSuccess: () => {
				router.push("/chat");
			},
		});

	const error =
		invitationError || acceptInvitationError || rejectInvitationError;

	return (
		<div className="min-h-[80vh] flex items-center justify-center">
			<div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
			{isLoading ? (
				<InvitationSkeleton />
			) : error ? (
				<InvitationError />
			) : invitation ? (
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Organization Invitation</CardTitle>
						<CardDescription>
							You've been invited to join an organization
						</CardDescription>
					</CardHeader>
					<CardContent>
						{invitation.status === "pending" && (
							<div className="space-y-4">
								<p>
									<strong>{invitation?.inviterEmail}</strong> has invited you to
									join <strong>{invitation?.organizationName}</strong>.
								</p>
								<p>
									This invitation was sent to{" "}
									<strong>{invitation?.email}</strong>.
								</p>
							</div>
						)}
						{invitation.status === "accepted" && (
							<div className="space-y-4">
								<div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
									<CheckIcon className="w-8 h-8 text-green-600" />
								</div>
								<h2 className="text-2xl font-bold text-center">
									Welcome to {invitation?.organizationName}!
								</h2>
								<p className="text-center">
									You've successfully joined the organization. We're excited to
									have you on board!
								</p>
							</div>
						)}
						{invitation.status === "rejected" && (
							<div className="space-y-4">
								<div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
									<XIcon className="w-8 h-8 text-red-600" />
								</div>
								<h2 className="text-2xl font-bold text-center">
									Invitation Declined
								</h2>
								<p className="text-center">
									You&lsquo;ve declined the invitation to join{" "}
									{invitation?.organizationName}.
								</p>
							</div>
						)}
					</CardContent>
					{invitation.status === "pending" && (
						<CardFooter className="flex justify-between">
							<Button variant="outline" onClick={() => rejectInvitation()}>
								Decline
							</Button>
							<Button onClick={() => acceptInvitation()}>
								Accept Invitation
							</Button>
						</CardFooter>
					)}
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>No invitation found</CardTitle>
						<CardDescription>
							Please check the invitation link you received.
						</CardDescription>
					</CardHeader>
				</Card>
			)}
		</div>
	);
}

function InvitationSkeleton() {
	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<div className="flex items-center space-x-2">
					<Skeleton className="w-6 h-6 rounded-full" />
					<Skeleton className="h-6 w-24" />
				</div>
				<Skeleton className="h-4 w-full mt-2" />
				<Skeleton className="h-4 w-2/3 mt-2" />
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</CardContent>
			<CardFooter className="flex justify-end">
				<Skeleton className="h-10 w-24" />
			</CardFooter>
		</Card>
	);
}
