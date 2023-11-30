import typia from "typia";
import { ProblemType, SupportForm } from "./types";

export interface TicketCreate {
	title: string;
	group: string;
	customer_id: string;
	article: Article;
}

export interface Article {
	subject: string;
	body: string;
	type: ArticleType;
	content_type: "text/html" | "text/plain";
	internal: boolean;
	attachments?: ArticleAttachment[];
}

export interface ArticleAttachment {
	filename: string;
	/**
	 * base 64 encoded file content
	 */
	data: string;
	"mime-type": string;
}

export enum ArticleType {
	EMAIL = "email",
	NOTE = "note",
}

export interface TicketCreated {
	number: string;
}

/**
 *
 * @param apiUrl
 * @param token
 * @param ticket
 * @returns Ticket number
 */
export async function createTicket(
	siteUrl: string,
	token: string,
	ticket: TicketCreate,
): Promise<string> {
	const req = await fetch(`${siteUrl}/api/v1/tickets`, {
		body: typia.json.stringify(ticket),
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Token token=${token}`,
		},
	});

	const json = await req.json<TicketCreated>();

	return json.number;
}

export async function formatTicket(form: SupportForm): Promise<TicketCreate> {
	const attachments = await Promise.all(
		form.images?.map<Promise<ArticleAttachment>>(async (blob) => ({
			filename: blob.name,
			"mime-type": blob.type,
			data: Buffer.from(await blob.arrayBuffer()).toString("base64"),
		})),
	);
	return {
		title: `Support form: ${form.subject}`,
		group: "Users",
		customer_id: `guess:${form.email}`,
		article: {
			subject: `Support form: ${form.subject}`,
			type: ArticleType.EMAIL,
			content_type: "text/plain",
			internal: false,
			attachments,
			body: generateBody(form),
		},
	};
}

export function generateBody(form: SupportForm): string {
	switch (form.problem) {
		case ProblemType.WARRANTY:
			return `Name: ${form.name}
Issue type: ${form.problem}
Order number: ${form.orderNo}
Specific set: ${form.whichSet ?? "Not given"}
Warranty issue: ${form.warrantyIssue}
Shipping information:
Address: ${form.address}
Extra address info: ${form.secondAddress}
Postal code: ${form.postalCode}
City: ${form.city}
Province/State: ${form.province ?? "Not given"}
Country: ${form.country}
Phone number: ${form.phoneNumber}

Description:
${form.description}`;
		case ProblemType.OTHER:
			return `Name: ${form.name}
Issue type: ${form.problem}
Order number: ${form.orderNo ?? "Not given"}

Description:
${form.description}`;
	}
}
