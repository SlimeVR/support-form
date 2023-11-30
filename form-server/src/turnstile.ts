export async function turnstileCheck(
	ip: string | null,
	token: string,
	secretKey: string,
): Promise<boolean> {
	let formData = new FormData();

	formData.append("secret", secretKey);
	formData.append("response", token);
	if (ip !== null) {
		formData.append("remoteip", ip);
	}

	const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
	const result = await fetch(url, {
		body: formData,
		method: "POST",
	});

	const outcome: TurnstileVerify = await result.json();

	return outcome.success;
}

export interface TurnstileVerify {
	success: boolean;
}
