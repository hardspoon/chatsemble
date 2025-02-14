"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { LogoIcon } from "@/components/icons/logo-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AvatarPicker } from "./avatar-picker";

export const signupFormSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	name: z.string().min(2, "Name must be at least 2 characters"),
	orgName: z.string().min(2, "Organization name must be at least 2 characters"),
	image: z.string().min(1, "Please select an avatar"),
});

export default function SignupForm() {
	const router = useRouter();
	const form = useForm<z.infer<typeof signupFormSchema>>({
		resolver: zodResolver(signupFormSchema),
		defaultValues: {
			email: "",
			password: "",
			name: "",
			orgName: "",
			image: "/notion-avatars/avatar-01.svg",
		},
	});

	const { mutate, isPending, error } = useMutation({
		mutationFn: async (values: z.infer<typeof signupFormSchema>) => {
			const { data, error } = await authClient.signUp.email({
				email: values.email,
				password: values.password,
				name: values.name,
				image: values.image,
				fetchOptions: {
					body: {
						orgName: values.orgName,
						email: values.email,
						password: values.password,
						name: values.name,
						image: values.image,
					},
				},
				callbackURL: "/",
			});

			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			router.push("/");
		},
	});

	const onSubmit = (values: z.infer<typeof signupFormSchema>) => {
		mutate(values);
	};

	return (
		<div className="container mx-auto flex min-h-screen w-full flex-col items-center justify-center py-8">
			<Card className="w-full">
				<CardHeader className="flex flex-row items-center justify-start gap-4">
					<LogoIcon className="size-14" />
					<CardTitle className="text-2xl font-bold">
						Create your account
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							<div className="grid gap-8 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="text-lg font-medium">Profile Information</h3>
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Full Name</FormLabel>
												<FormControl>
													<Input
														placeholder="Your Name"
														type="text"
														autoComplete="name"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														placeholder="name@example.com"
														type="email"
														autoComplete="email"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														placeholder="Create a secure password"
														type="password"
														autoComplete="new-password"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="orgName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Organization Name</FormLabel>
												<FormControl>
													<Input
														placeholder="Your Company or Team Name"
														type="text"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-medium">
										Personalize Your Profile
									</h3>
									<div className="rounded-lg border p-4">
										<AvatarPicker control={form.control} />
									</div>
								</div>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error.message}</AlertDescription>
								</Alert>
							)}

							<div className="flex flex-col items-center gap-4">
								<Button
									type="submit"
									className="w-full max-w-[400px]"
									disabled={isPending}
								>
									{isPending ? "Creating account..." : "Create Account"}
								</Button>

								<div className="text-center text-sm text-muted-foreground">
									Already have an account?{" "}
									<Link
										href="/auth/login"
										className={cn(
											buttonVariants({ variant: "link" }),
											"p-0 text-primary",
										)}
									>
										Sign in
									</Link>
								</div>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
