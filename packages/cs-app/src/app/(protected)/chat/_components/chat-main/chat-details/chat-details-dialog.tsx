import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, UserPlus } from "lucide-react";
import { ChatMembers } from "./chat-members";
import { ChatDetailsSection } from "./chat-details-section";

type ChatDetailsDialogView = "details" | "configuration" | "members";

export type ChatDetailsDialogOpen = {
	view: ChatDetailsDialogView;
} | null;

interface ChatDetailsDialogProps {
	open: ChatDetailsDialogOpen;
	onOpenChange: (open: ChatDetailsDialogOpen) => void;
}

export function ChatDetailsDialog({
	open,
	onOpenChange,
}: ChatDetailsDialogProps) {
	return (
		<Dialog
			open={!!open}
			onOpenChange={(open) => {
				if (!open) {
					onOpenChange(null);
				}
			}}
		>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Chat Details</DialogTitle>
					<DialogDescription>
						Manage your chat room settings and members
					</DialogDescription>
				</DialogHeader>
				{open && (
					<ChatDetailsDialogContent open={open} onOpenChange={onOpenChange} />
				)}
			</DialogContent>
		</Dialog>
	);
}

function ChatDetailsDialogContent({
	open,
}: ChatDetailsDialogProps & {
	open: NonNullable<ChatDetailsDialogProps["open"]>;
}) {
	return (
		<Tabs defaultValue={open.view} className="w-full">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="details" className="flex items-center gap-2">
					<Info className="h-4 w-4" />
					Details
				</TabsTrigger>
				<TabsTrigger value="members" className="flex items-center gap-2">
					<UserPlus className="h-4 w-4" />
					Members
				</TabsTrigger>
			</TabsList>
			<TabsContent value="details">
				<ChatDetailsSection />
			</TabsContent>
			<TabsContent value="members">
				<ChatMembers />
			</TabsContent>
		</Tabs>
	);
}
