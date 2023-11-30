/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import typia from "typia";
import { ProblemType, SupportForm, checkSupportForm } from "./types";
import { turnstileCheck } from "./turnstile";
import { ArticleAttachment, ArticleType, TicketCreate, createTicket, formatTicket } from "./zammad";
import { Buffer } from "node:buffer";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
	TURNSTILE_SECRET_KEY: string;
	ZAMMAD_API_TOKEN: string;
	ZAMMAD_URL: string;
	MAX_FILES_SIZE: number;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/submit/support") {
			return await submitHandler(request, env);
		}
		return new Response("Not found", { status: 404 });
	},
};

async function submitHandler(request: Request, env: Env): Promise<Response> {
	if (request.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
		});
	}
	const body = await request.formData();
	const ip = request.headers.get("CF-Connecting-IP");
	const { ...form } = Object.fromEntries<unknown>(body);
	form.images = body.getAll("images");
	if (!typia.is<SupportForm>(form)) {
		return new Response("Invalid form", { status: 400 });
	}
	if (
		!(await turnstileCheck(
			ip,
			form["cf-turnstile-response"],
			env.TURNSTILE_SECRET_KEY,
		))
	) {
		return new Response("The provided Turnstile token was not valid!", {
			status: 401,
		});
	}

	if (form.images.reduce((prev, file) => file.size + prev, 0) > env.MAX_FILES_SIZE) {
		return new Response("The total files are too big", { status: 413 });
	}

	const ticketNumber = await createTicket(
		env.ZAMMAD_URL,
		env.ZAMMAD_API_TOKEN,
		await formatTicket(form),
	);

	return new Response(JSON.stringify(form), { status: 201 });
}
