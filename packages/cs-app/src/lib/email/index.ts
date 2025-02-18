import "server-only";

import { type ComponentType, createElement } from "react";
import { Resend } from "resend";
import {
	EmailMagicLinkTemplate,
	type EmailMagicLinkTemplateProps,
} from "@/lib/email/templates/email-magic-link";

const resend = new Resend(process.env.RESEND_API_KEY);

// Create a record of all available email templates
const emailTemplates = {
	"email-magic-link": {
		id: "email-magic-link",
		subject: "Magic link to sign in",
		component: EmailMagicLinkTemplate,
	},
} as const;

// Create a type that represents all possible template IDs
type TemplateId = keyof typeof emailTemplates;

// Create a type that maps template IDs to their respective prop types
type TemplateProps = {
	"email-magic-link": EmailMagicLinkTemplateProps;
};

export const sendMail = async <T extends TemplateId>(
	to: string,
	templateId: T,
	props: TemplateProps[T],
): Promise<void> => {
	if (process.env.MOCK_SEND_EMAIL === "true") {
		console.log(
			"📨 Email sent to:",
			to,
			"with template:",
			templateId,
			"and props:",
			props,
		);
		return;
	}

	const emailSender = process.env.EMAIL_SENDER;

	if (!emailSender) {
		throw new Error("EMAIL_SENDER is not set");
	}

	const template = emailTemplates[templateId];
	const subject = template.subject;
	const Component = template.component;

	// Use a type assertion to help TypeScript understand the component type
	const emailElement = createElement(
		Component as ComponentType<TemplateProps[T]>,
		props,
	);

	try {
		await resend.emails.send({
			from: emailSender,
			to,
			subject,
			react: emailElement,
		});

		console.log("📨 Email sent to:", to, "with template:", templateId);
	} catch (error) {
		console.error("Failed to send email:", error);
		throw new Error("Failed to send email");
	}
};
