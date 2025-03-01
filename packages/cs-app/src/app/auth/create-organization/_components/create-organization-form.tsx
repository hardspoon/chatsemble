"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { LogoIcon } from "@/components/icons/logo-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "better-auth";

export const createOrganizationFormSchema = z.object({
	name: z.string().min(2, "Organization name must be at least 2 characters"),
	slug: z
		.string()
		.min(2, "Slug must be at least 2 characters")
		.regex(
			/^[a-z0-9-]+$/,
			"Slug can only contain lowercase letters, numbers, and hyphens",
		),
});

const orgNameAndSlugFromUser = (user: User) => {
	const emailFirstPart = user.email.split("@")[0];
	return {
		name: emailFirstPart,
		slug: emailFirstPart,
	};
};

export function CreateOrganizationForm({ user }: { user: User }) {
	const router = useRouter();
	const { toast } = useToast();

	const form = useForm<z.infer<typeof createOrganizationFormSchema>>({
		resolver: zodResolver(createOrganizationFormSchema),
		defaultValues: orgNameAndSlugFromUser(user),
		//mode: "onChange",
	});

	// Watch the name field to generate the slug
	const name = form.watch("name");

	// Update slug whenever name changes
	useEffect(() => {
		const generatedSlug = name
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
		form.setValue("slug", generatedSlug, { shouldValidate: true });
	}, [name, form]);

	const { mutate, isPending, error } = useMutation({
		mutationFn: async (
			values: z.infer<typeof createOrganizationFormSchema>,
		) => {
			const { data, error } = await authClient.organization.create({
				name: values.name,
				slug: values.slug,
			});

			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			toast({
				title: "Organization created successfully",
			});
			router.push("/chat");
		},
	});

	const onSubmit = (values: z.infer<typeof createOrganizationFormSchema>) => {
		mutate(values);
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="flex flex-row items-center justify-start gap-4">
				<LogoIcon className="size-14" />
				<CardTitle className="text-2xl font-bold">
					Create Your Organization
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Organization Name</FormLabel>
										<FormControl>
											<Input placeholder="My Organization" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="slug"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Organization Slug</FormLabel>
										<FormControl>
											<Input
												placeholder="my-organization"
												{...field}
												disabled
												className="bg-muted"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error.message}</AlertDescription>
							</Alert>
						)}

						<Button type="submit" className="w-full" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Organization"
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
