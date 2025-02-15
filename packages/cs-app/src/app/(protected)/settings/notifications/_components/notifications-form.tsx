"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

const notificationsFormSchema = z.object({
	communication_emails: z.boolean().default(false).optional(),
	marketing_emails: z.boolean().default(false).optional(),
	social_emails: z.boolean().default(false).optional(),
	security_emails: z.boolean(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<NotificationsFormValues> = {
	communication_emails: true,
	marketing_emails: false,
	social_emails: true,
	security_emails: true,
};

export function NotificationsForm() {
	const form = useForm<NotificationsFormValues>({
		resolver: zodResolver(notificationsFormSchema),
		defaultValues,
	});

	function onSubmit(data: NotificationsFormValues) {
		toast({
			title: "You submitted the following values:",
			description: (
				<pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
					<code className="text-white">{JSON.stringify(data, null, 2)}</code>
				</pre>
			),
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<h3 className="mb-4 text-sm font-medium">Email Notifications</h3>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="communication_emails"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Communication emails</FormLabel>
										<FormDescription>
											Receive emails about your account activity.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="marketing_emails"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Marketing emails</FormLabel>
										<FormDescription>
											Receive emails about new products, features, and more.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="social_emails"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Social emails</FormLabel>
										<FormDescription>
											Receive emails for chat invites, mentions and more.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="security_emails"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
											disabled
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Security emails</FormLabel>
										<FormDescription>
											Receive emails about your account security.
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
					</div>
				</div>
				<Button type="submit">Update notifications</Button>
			</form>
		</Form>
	);
}
