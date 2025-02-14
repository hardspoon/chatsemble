"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { LogoIcon } from "@/components/icons/logo-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

const formSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	name: z.string().min(2, "Name must be at least 2 characters"),
});

export default function SignupForm() {
	const router = useRouter();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
	});

	const { mutate, isPending, error } = useMutation({
		mutationFn: async (values: z.infer<typeof formSchema>) => {
			const { data, error } = await authClient.signUp.email({
				email: values.email,
				password: values.password,
				name: values.name,
				fetchOptions: {
					body: {
						orgName: `${values.name} Organization`,
						email: values.email,
						password: values.password,
						name: values.name,
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

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		mutate(values);
	};

	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<Card className="w-full max-w-[400px]">
				<CardHeader className="flex flex-col items-center space-y-2">
					<LogoIcon className="size-28" />
					<CardTitle className="text-2xl font-bold">Sign up</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
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
										<FormControl>
											<Input
												placeholder="Password"
												type="password"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error.message}</AlertDescription>
								</Alert>
							)}

							<Button type="submit" className="w-full" disabled={isPending}>
								{isPending ? "Creating account..." : "Sign up"}
							</Button>

							<div className="text-center text-sm text-muted-foreground">
								Already have an account?{" "}
								<Button
									variant="link"
									className="p-0 text-primary"
									onClick={() => router.push("/auth/login")}
								>
									Sign in
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
