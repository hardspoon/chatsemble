"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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

const formSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export default function LoginForm() {
	const searchParams = useSearchParams();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
	});

	const { mutate, isPending, error, isSuccess } = useMutation({
		mutationFn: async (email: string) => {
			const callbackUrl = searchParams.get("callbackUrl") ?? "/";
			const result = await signIn("magic-link", {
				email,
				callbackUrl,
				redirect: false,
			});

			if (result?.error) {
				throw new Error("Something went wrong. Please try again.");
			}
			return result;
		},
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		mutate(values.email);
	};

	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<Card className="w-full max-w-[400px]">
				<CardHeader className="flex flex-col items-center space-y-2">
					<LogoIcon className="size-28" />
					<CardTitle className="text-2xl font-bold">Sign in</CardTitle>
				</CardHeader>
				<CardContent>
					{isSuccess ? (
						<Alert variant="success">
							<AlertDescription>
								Check your email for the magic link!
							</AlertDescription>
						</Alert>
					) : (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
							>
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

								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error.message}</AlertDescription>
									</Alert>
								)}

								<Button type="submit" className="w-full" disabled={isPending}>
									{isPending ? "Sending..." : "Sign in with Email"}
								</Button>
							</form>
						</Form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
