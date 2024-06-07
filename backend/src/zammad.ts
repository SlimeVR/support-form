import { alpha3ToAlpha2, registerLocale, getName } from "i18n-iso-countries";
import countryEn from "i18n-iso-countries/langs/en.json";
import typia from "typia";
import { ProblemType, SupportForm } from "form-types";
import { escape as escapeHtml } from "html-escaper";
import { Buffer } from "node:buffer";
const html = (strings: string[] | ArrayLike<string>, ...values: any[]) =>
	String.raw({ raw: strings }, ...values);

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
	sender: "Agent" | "Customer" | "System";
	to: string;
	cc?: string;
	from: string;
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

	const json = (await req.json()) as TicketCreated;

	return json.number;
}
const BODY_START = "We received your message, here's what it contained:";
const BODY_END =
	"We'll get back to you ASAP! You can reply to this email " +
	"if you want to add something to your ticket.";
export async function formatTicket(
	form: SupportForm & { images: File[] },
	supportEmail: string,
): Promise<TicketCreate> {
	const attachments = await Promise.all(
		form.images.map<Promise<ArticleAttachment>>(async (blob) => ({
			filename: blob.name,
			"mime-type": blob.type || "text/plain",
			data: Buffer.from(await blob.arrayBuffer()).toString("base64"),
		})),
	);
	return {
		// TODO: Missing timestamp on title and subject
		title: `Support form: ${form.problem}`,
		group: "Users",
		customer_id: `guess:${form.email}`,
		article: {
			subject: `Support form: ${form.problem}`,
			type: ArticleType.EMAIL,
			content_type: "text/html",
			internal: false,
			attachments,
			body: `${BODY_START}<br />${generateBody(form)}<br /><br />${BODY_END}`,
			sender: "Agent",
			from: `Support Form <${supportEmail}>`,
			to: `${form.name} <${form.email}>`,
		},
	};
}

export function generateBody(form: SupportForm): string {
	switch (form.problem) {
		case ProblemType.WARRANTY:
			registerLocale(countryEn)
			return html`<div>
				<div>
					<b>Issue type:</b>
					<pre>${escapeHtml(form.problem)}</pre>
				</div>
				<div>
					<b>Order number:</b>
					<pre>${escapeHtml(form.orderNo)}</pre>
				</div>
				<div>
					<b>Specific set:</b>
					<pre>
${form.whichSet ? escapeHtml(form.whichSet) : "Not given"}</pre
					>
				</div>
				<div>
					<b>Warranty issue:</b>
					<pre>${escapeHtml(form.warrantyIssue)}</pre>
				</div>
				<h3>Shipping information:</h3>
				<div>
					<b>Name:</b>
					<code>${escapeHtml(form.name)}</code>
				</div>
				<div>
					<b>Phone number:</b>
					<code>${escapeHtml(form.phoneNumber)}</code>
				</div>
				<div>
					<b>Address:</b>
					<code
						>${escapeHtml(form.address)}${form.secondAddress
							? `, ${escapeHtml(form.secondAddress)}`
							: ""}</code
					>
				</div>
				<div>
					<b>City:</b>
					<code
						>${escapeHtml(form.city)}${form.province
							? `, ${escapeHtml(form.province)}`
							: ""}</code
					>
				</div>
				<div>
					<b>Postal code:</b>
					<code>${form.postalCode ? escapeHtml(form.postalCode) : "0"}</code>
				</div>
				<div>
					<b>Country:</b>
					<code
						>${escapeHtml(
							`${alpha3ToAlpha2(form.country)}, ${getName(form.country, "en")}`,
						)}</code
					>
				</div>
				<h3>Message:</h3>
				<div>
					<pre>${escapeHtml(form.description.trim())}</pre>
				</div>
			</div>`;
		case ProblemType.OTHER:
			return html`<div>
				<div>
					<b>Name:</b>
					<pre>${escapeHtml(form.name)}</pre>
				</div>
				<div>
					<b>Issue type:</b>
					<pre>${escapeHtml(form.problem)}</pre>
				</div>
				<div>
					<b>Order number:</b>
					<pre>${form.orderNo ? escapeHtml(form.orderNo) : "Not given"}</pre>
				</div>
				<div>
					<b>Message:</b>
					<pre>${escapeHtml(form.description.trim())}</pre>
				</div>
			</div>`;
	}
}
