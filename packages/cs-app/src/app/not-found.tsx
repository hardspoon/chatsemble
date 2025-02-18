import { LogoIcon } from "@/components/icons/logo-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center p-4">
			<Card className="w-full max-w-[400px] text-center">
				<CardHeader className="flex flex-col items-center space-y-2">
					<LogoIcon className="size-28 animate-bounce" />
					<CardTitle className="text-4xl font-bold text-primary">404</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<p className="text-xl text-gray-700">
						Oops! This page is playing hide and seek (and winning!) 🙈
					</p>
					<p className="text-gray-600">
						Let&apos;s get you back somewhere familiar.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
