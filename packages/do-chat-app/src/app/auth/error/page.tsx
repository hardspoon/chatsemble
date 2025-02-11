import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoIcon } from "@/components/icons/logo-icon";
import Link from "next/link";

export default function ErrorPage() {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center p-4">
			<Card className="w-full max-w-[400px] text-center">
				<CardHeader className="flex flex-col items-center space-y-2">
					<LogoIcon className="size-28 animate-bounce" />
					<CardTitle className="text-4xl font-bold text-primary">
						Oops!
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<p className="text-xl text-gray-700">
						Looks like something went wrong with authentication 🔐
					</p>
					<p className="text-gray-600">
						Don&apos;t worry, even the best of us get locked out sometimes!
					</p>
					<Link
						href="/auth/login"
						className="inline-block px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/80 transition-all duration-200 transform hover:scale-105"
					>
						Try Again 🔄
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
