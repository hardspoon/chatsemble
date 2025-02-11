import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Hello World!</CardTitle>
			</CardHeader>
			<CardContent>
				<p>This is a card</p>
				<Button>Click me</Button>
			</CardContent>
		</Card>
	);
}
