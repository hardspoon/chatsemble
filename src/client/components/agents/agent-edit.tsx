"use client";

import { AgentNotFound } from "@/components/agents/agent-placeholder";

import { honoClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { AgentSkeleton } from "./agent-skeleton";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { type AgentFormValues, createAgentSchema } from "@/shared/types";
import { Bot } from "lucide-react";
import {
	AppHeader,
	AppHeaderIcon,
	AppHeaderSeparator,
	AppHeaderTitle,
} from "../layout/app-header";

import { Button } from "../ui/button";
import { AgentForm } from "./agent-form";
import { toast } from "sonner";

export function AgentEdit({ agentId }: { agentId: string }) {
	const { data: agent, isLoading } = useQuery({
		queryKey: ["agent", agentId],
		queryFn: async () => {
			const response = await honoClient.api.agents[":id"].$get({
				param: { id: agentId },
			});
			const agent = await response.json();
			return agent;
		},
	});

	const queryClient = useQueryClient();

	const form = useForm<AgentFormValues>({
		resolver: zodResolver(createAgentSchema),
		values: {
			name: agent?.name ?? "",
			image: agent?.image ?? "",
			description: agent?.description ?? "",
			tone: agent?.tone ?? "formal",
			verbosity: agent?.verbosity ?? "concise",
			emojiUsage: agent?.emojiUsage ?? "none",
			languageStyle: agent?.languageStyle ?? "simple",
		},
	});

	const updateAgentMutation = useMutation({
		mutationFn: async (values: AgentFormValues) => {
			const response = await honoClient.api.agents[":id"].$put({
				param: { id: agentId },
				json: values,
			});
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agents"] });
			queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
			toast.success("Agent updated successfully");
		},
	});

	const onSubmit = (values: AgentFormValues) => {
		updateAgentMutation.mutate(values);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex-1 flex flex-col h-full"
			>
				<AppHeader>
					<AppHeaderIcon>
						<Bot />
					</AppHeaderIcon>
					<AppHeaderSeparator />
					<AppHeaderTitle>Edit Agent</AppHeaderTitle>
					<Button type="submit" size="sm" className="ml-auto">
						Save Changes
					</Button>
				</AppHeader>
				<div className="flex-1 flex flex-col overflow-y-auto">
					<div className="w-full flex-1 flex flex-col max-w-screen-lg mx-auto p-6">
						{isLoading ? (
							<AgentSkeleton />
						) : agent ? (
							<AgentForm />
						) : (
							<AgentNotFound />
						)}
					</div>
				</div>
			</form>
		</Form>
	);
}
