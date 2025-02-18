import Link from "next/link";

import { LogoIcon } from "@/components/icons/logo-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoggedInCardProps {
	email: string;
}

export function LoggedInCard({ email }: LoggedInCardProps) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<Card className="w-full max-w-[400px]">
				<CardHeader className="flex flex-col items-center space-y-2">
					<LogoIcon className="size-28" />
					<CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertDescription>You are logged in as {email}</AlertDescription>
					</Alert>
					<Button className="w-full mt-4" asChild>
						<Link href="/chat">Go to chat</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
