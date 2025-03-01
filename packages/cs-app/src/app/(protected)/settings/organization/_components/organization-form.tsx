"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ChevronDownIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { InviteMemberDialog } from "./invite-member-dialog";
import { CopyButton } from "@/components/copy-button";
import type { ActiveOrganization, Session } from "@/types/auth";

export function OrganizationForm({
	session,
	activeOrganization,
}: {
	session: Session;
	activeOrganization: ActiveOrganization;
}) {
	const [optimisticOrg, setOptimisticOrg] = useState<ActiveOrganization | null>(
		activeOrganization,
	);

	const organizations = authClient.useListOrganizations();

	const [isRevoking, setIsRevoking] = useState<string[]>([]);

	const currentMember = optimisticOrg?.members.find(
		(member) => member.userId === session?.user.id,
	);

	const revokeInvite = (
		invitation: ActiveOrganization["invitations"][number],
	) => {
		authClient.organization.cancelInvitation(
			{
				invitationId: invitation.id,
			},
			{
				onRequest: () => {
					setIsRevoking([...isRevoking, invitation.id]);
				},
				onSuccess: () => {
					toast({
						title: "Invitation revoked successfully",
					});
					setIsRevoking(isRevoking.filter((id) => id !== invitation.id));
					if (optimisticOrg) {
						const invitations = optimisticOrg.invitations.filter(
							(inv) => inv.id !== invitation.id,
						);
						setOptimisticOrg({
							...optimisticOrg,
							invitations: invitations,
						});
					}
				},
				onError: (ctx: {
					error: { message: string };
				}) => {
					toast({
						title: "Error",
						description: ctx.error.message,
						variant: "destructive",
					});
					setIsRevoking(isRevoking.filter((id) => id !== invitation.id));
				},
			},
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Organization</CardTitle>
				<div className="flex justify-between">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="flex items-center gap-1 cursor-pointer">
								<p className="text-sm">
									<span className="font-bold" />
									{optimisticOrg?.name || "Personal"}
								</p>

								<ChevronDownIcon />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem
								className="py-1"
								onClick={async () => {
									authClient.organization.setActive({
										organizationId: null,
									});
									setOptimisticOrg(null);
								}}
							>
								<p className="text-sm sm">Personal</p>
							</DropdownMenuItem>
							{organizations.data?.map((org) => (
								<DropdownMenuItem
									className="py-1"
									key={org.id}
									onClick={async () => {
										if (org.id === optimisticOrg?.id) {
											return;
										}
										setOptimisticOrg({
											members: [],
											invitations: [],
											...org,
										});
										const { data } = await authClient.organization.setActive({
											organizationId: org.id,
										});
										setOptimisticOrg(data);
									}}
								>
									<p className="text-sm sm">{org.name}</p>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex items-center gap-2">
					<Avatar className="rounded-none">
						<AvatarImage
							className="object-cover w-full h-full rounded-none"
							src={optimisticOrg?.logo || ""}
						/>
						<AvatarFallback className="rounded-none">
							{optimisticOrg?.name?.charAt(0) || "P"}
						</AvatarFallback>
					</Avatar>
					<div>
						<p>{optimisticOrg?.name || "Personal"}</p>
						<p className="text-xs text-muted-foreground">
							{optimisticOrg?.members.length || 1} members
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex gap-8 flex-col md:flex-row">
					<div className="flex flex-col gap-2 flex-grow">
						<p className="font-medium border-b-2 border-b-foreground/10">
							Members
						</p>
						<div className="flex flex-col gap-2">
							{optimisticOrg?.members.map((member) => (
								<div
									key={member.id}
									className="flex justify-between items-center"
								>
									<div className="flex items-center gap-2">
										<Avatar className="sm:flex w-9 h-9">
											<AvatarImage
												src={member.user.image || ""}
												className="object-cover"
											/>
											<AvatarFallback>
												{member.user.name?.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm">{member.user.name}</p>
											<p className="text-xs text-muted-foreground">
												{member.role}
											</p>
										</div>
									</div>
									{member.role !== "owner" &&
										(currentMember?.role === "owner" ||
											currentMember?.role === "admin") && (
											<Button
												size="sm"
												variant="destructive"
												onClick={() => {
													authClient.organization.removeMember({
														memberIdOrEmail: member.id,
													});
												}}
											>
												{currentMember?.id === member.id ? "Leave" : "Remove"}
											</Button>
										)}
								</div>
							))}
							{!optimisticOrg?.id && session && (
								<div>
									<div className="flex items-center gap-2">
										<Avatar>
											<AvatarImage src={session?.user.image || ""} />
											<AvatarFallback>
												{session?.user.name?.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm">{session?.user.name}</p>
											<p className="text-xs text-muted-foreground">Owner</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="flex flex-col gap-2 flex-grow">
						<p className="font-medium border-b-2 border-b-foreground/10">
							Invites
						</p>
						<div className="flex flex-col gap-2">
							{optimisticOrg?.invitations
								.filter((invitation) => invitation.status === "pending")
								.map((invitation) => (
									<div
										key={invitation.id}
										className="flex items-center justify-between"
									>
										<div>
											<p className="text-sm">{invitation.email}</p>
											<p className="text-xs text-muted-foreground">
												{invitation.role}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Button
												disabled={isRevoking.includes(invitation.id)}
												size="sm"
												variant="destructive"
												onClick={() => revokeInvite(invitation)}
											>
												{isRevoking.includes(invitation.id) ? (
													<Loader2 className="animate-spin" size={16} />
												) : (
													"Revoke"
												)}
											</Button>
											<div>
												<CopyButton
													textToCopy={`${typeof window !== "undefined" ? window.location.origin : ""}/accept-invitation/${invitation.id}`}
												/>
											</div>
										</div>
									</div>
								))}
							{optimisticOrg?.invitations.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No Active Invitations
								</p>
							)}
							{!optimisticOrg?.id && (
								<Label className="text-xs text-muted-foreground">
									You can&apos;t invite members to your personal workspace.
								</Label>
							)}
						</div>
					</div>
				</div>
				<div className="flex justify-end w-full mt-4">
					<div>
						<div>
							{optimisticOrg?.id && (
								<InviteMemberDialog
									setOptimisticOrg={setOptimisticOrg}
									optimisticOrg={optimisticOrg}
								/>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
