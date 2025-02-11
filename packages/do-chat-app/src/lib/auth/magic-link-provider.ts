import { sendMail } from "@/lib/email";
import type { Provider } from "next-auth/providers";

export function MagicLinkProvider(): Provider {
	return {
		id: "magic-link",
		name: "Magic Link",
		type: "email",
		maxAge: 24 * 60 * 60, // 24 hours
		async sendVerificationRequest({ identifier: email, url }) {
			try {
				await sendMail(email, "email-magic-link", {
					signInUrl: url,
					email,
				});
			} catch (error) {
				console.error("Error sending verification email:", error);
				throw new Error("Failed to send verification email");
			}
		},
	};
}
