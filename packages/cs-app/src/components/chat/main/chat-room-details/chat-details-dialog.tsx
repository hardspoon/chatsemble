import { useChatWsContext } from "@/components/chat/providers/chat-ws-provider";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, UserPlus } from "lucide-react";
import { ChatDetailsMembersSection } from "./chat-details-members-section";
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
	const {
		mainChat: { status },
	} = useChatWsContext();
	return (
		<Dialog
			open={!!open}
			onOpenChange={(open) => {
				if (!open) {
					onOpenChange(null);
				}
			}}
		>
			<DialogContent className="max-w-[94vw] max-h-[95vh] rounded-lg sm:max-w-lg 2xl:max-w-2xl h-full sm:max-h-[70vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Chat Details</DialogTitle>
					<DialogDescription>
						Manage your chat room settings and members
					</DialogDescription>
				</DialogHeader>
				{open && status === "success" ? (
					<ChatDetailsDialogContent open={open} onOpenChange={onOpenChange} />
				) : (
					<ChatDetailsDialogContentSkeleton />
				)}
			</DialogContent>
		</Dialog>
	);
}

function ChatDetailsDialogContentSkeleton() {
	return (
		<div className="w-full h-full flex flex-col gap-4">
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-36 w-full" />
		</div>
	);
}

function ChatDetailsDialogContent({
	open,
}: ChatDetailsDialogProps & {
	open: NonNullable<ChatDetailsDialogProps["open"]>;
}) {
	return (
		<Tabs defaultValue={open.view} className="w-full flex-1 flex flex-col">
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
			<TabsContent value="details" className="flex-1">
				<ChatDetailsSection />
			</TabsContent>
			<TabsContent value="members" className="flex-1">
				<ChatDetailsMembersSection />
			</TabsContent>
		</Tabs>
	);
}
