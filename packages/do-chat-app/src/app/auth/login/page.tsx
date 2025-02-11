import Link from "next/link";

import { LogoIcon } from "@/components/icons/logo-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getNextAuth } from "@/auth";
import LoginForm from "./_components/login-form";

export default async function LoginPage() {
	const { auth } = getNextAuth();
	const session = await auth();

	if (session?.user) {
		return (
			<div className="flex h-screen w-screen flex-col items-center justify-center">
				<Card className="w-full max-w-[400px]">
					<CardHeader className="flex flex-col items-center space-y-2">
						<LogoIcon className="size-28" />
						<CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertDescription>
								You are logged in as {session.user.email}
							</AlertDescription>
						</Alert>
						<Button className="w-full mt-4" asChild>
							<Link href="/editor">Go to Editor</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return <LoginForm />;
}

export const dynamic = "force-dynamic";
