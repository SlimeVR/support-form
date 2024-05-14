import typia from "typia";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import fastifyMultidata from "@fastify/multipart";
import { SupportForm } from "form-types";
import { turnstileCheck } from "./turnstile";
import { createTicket, formatTicket } from "./zammad";

export interface Env {
	TURNSTILE_SECRET_KEY: string;
	ZAMMAD_API_TOKEN: string;
	ZAMMAD_URL: string;
	MAX_FILES_SIZE: string;
	SUPPORT_EMAIL: string;
}

const fastify = Fastify({ logger: true });
fastify.register(fastifyMultidata, {
	attachFieldsToBody: true,
	limits: {
		parts: 100,
	},
});
fastify.register(helmet);
fastify.register(cors, {
	origin: "*",
});

fastify.post("/submit/support", async (req, reply) => {
	req.body
});

export default {
	async fetch(request: Request, env: Env, _: ExecutionContext): Promise<Response> {
		if (request.method === "OPTIONS") {
			return handleOptions(request);
		}
		const url = new URL(request.url);
		if (url.pathname === "/submit/support") {
			const response = await submitHandler(request, env);
			Object.entries(corsHeaders).forEach(([header, value]) =>
				response.headers.append(header, value),
			);
			return response;
		}
		return new Response("Not found", { status: 404, headers: { ...corsHeaders } });
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

	if (!onlyFiles(form)) {
		console.error("how did form do this");
		return new Response("Unreachable", { status: 500 });
	}

	if (
		!form.images.every(
			(file) => supportedFileTypes.has(file.type) || file.name.endsWith(".log"),
		)
	) {
		return new Response("The files sent are not the valid type of file", {
			status: 403,
		});
	}

	if (
		form.images.reduce((prev, file) => file.size + prev, 0) >
		Math.floor(parseFloat(env.MAX_FILES_SIZE))
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

	return new Response(
		JSON.stringify({
			success: true,
		}),
		{ status: 201 },
	);
}

const supportedFileTypes = new Set([
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/apng",
	"text/plain",
]);

function onlyFiles(form: SupportForm): form is SupportForm & { images: File[] } {
	if (!Array.isArray(form.images) || !(form.images[0] instanceof File)) {
		form.images = [];
	}
	return true;
}

// async function checkFileTypes(files: File[]): Promise<boolean> {
// 	for (const file of files) {
// 		const fileType = await fileTypeFromBlob(file);
// 		console.log(fileType)
// 		if (!fileType || !supportedFileTypes.has(fileType?.mime)) {
// 			return false;
// 		}
// 	}
// 	return true;
// }

try {
	await fastify.listen({ port: parseInt(process.env.PORT!!) });
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
