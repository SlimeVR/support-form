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
import { SupportForm } from "form-types";
import { turnstileCheck } from "./turnstile";
import { createTicket, formatTicket } from "./zammad";

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
	MAX_FILES_SIZE: string;
	SUPPORT_EMAIL: string;
}

export default {
	async fetch(request: Request, env: Env, _: ExecutionContext): Promise<Response> {
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
	const { ...a } = Object.fromEntries<unknown>(body);
	a.images = body.getAll("images");
	const validation = typia.validate<SupportForm>(a);
	if (!validation.success) {
		console.error(validation.errors);
		return new Response("Invalid form", { status: 400 });
	}
	const form = a as unknown as SupportForm;
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

	if (
		form.images.reduce((prev, file) => file.size + prev, 0) >
			Math.floor(parseFloat(env.MAX_FILES_SIZE)) &&
		form.images.every((file) => file.type.startsWith("image"))
	) {
		return new Response("The total files are too big", { status: 413 });
	}

	// const { results } =
	// 	form.orderNo === undefined
	// 		? { results: null }
	// 		: await env.DB.prepare("SELECT * FROM orders WHERE order_id = ?")
	// 				.bind(form.orderNo)
	// 				.all();

	const ticketNumber = await createTicket(
		env.ZAMMAD_URL,
		env.ZAMMAD_API_TOKEN,
		await formatTicket(form, env.SUPPORT_EMAIL),
	);

	return new Response(JSON.stringify(form), { status: 201 });
}
