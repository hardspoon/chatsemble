import { Button } from "@/components/ui/button";
import { useState } from "react";

export const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(textToCopy);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button size="sm" variant="outline" onClick={handleCopy}>
			{copied ? "Copied!" : "Copy Link"}
		</Button>
	);
};
