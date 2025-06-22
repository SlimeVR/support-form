import { ProblemType, SlimeSet, WarrantyIssue } from "form-types";
import countries, { alpha3ToAlpha2 } from "i18n-iso-countries";
import Choices from "choices.js";
import intlTelInput from "intl-tel-input/intlTelInputWithUtils";
import countryEn from "i18n-iso-countries/langs/en.json";
// import "choices.js/public/assets/styles/base.min.css";
import "choices.js/public/assets/styles/choices.min.css";
import "intl-tel-input/build/css/intlTelInput.css";
import { showError } from "./error";
import { Iti } from "intl-tel-input";

const TOTAL_FILE_LIMIT = 2.5e7; // 25MB

// Fetch country names
const promise = (async () => {
	countries.registerLocale(countryEn);
	const importedOnes = new Set(["en"]);
	for (const lang of navigator.languages) {
		const short = lang.substring(0, 2).toLowerCase();
		if (importedOnes.has(short)) continue;
		try {
			countries.registerLocale(
				await import(`i18n-iso-countries/langs/${short}.json`),
			);
			importedOnes.add(short);
		} catch (e) {
			console.error(`Couldn't find language "${short}" for country list`);
		}
	}
})();

// Ticket reason selector
{
	const problemSelect =
		document.querySelector<HTMLSelectElement>("#ContactForm-problem")!;

	const sections = new Map([
		[
			ProblemType.WARRANTY,
			document.querySelector<HTMLDivElement>("#ContactForm-warranty-problem")!,
		],
		[
			ProblemType.OTHER,
			document.querySelector<HTMLDivElement>("#ContactForm-other-problem")!,
		],
	]);

	const problemSelectEv = (value: ProblemType) => {
		sections.forEach((div, key) => {
			div.hidden = key !== value;
			div.querySelectorAll<HTMLInputElement>(
				"input[data-required], select[data-required]",
			).forEach((input) => (input.required = key === value));
		});
	};

	problemSelect.addEventListener("change", (ev) => {
		if (!(ev.target instanceof HTMLSelectElement)) {
			console.error("no event target");
			return;
		}

		problemSelectEv(ev.target.value as ProblemType);
	});

	Object.entries(ProblemType).forEach(([_, val]) => {
		problemSelect.options.add(new Option(val));
	});

	const item = problemSelect.options.item(problemSelect.options.selectedIndex);
	if (item?.value) problemSelectEv(item.value as ProblemType);
}

// Warranty issue selector
{
	const warrantySelect = document.querySelector<HTMLSelectElement>(
		"#ContactForm-warranty-issue",
	)!;
	Object.entries(WarrantyIssue).forEach(([_, val]) => {
		warrantySelect.options.add(new Option(val));
	});
}

// Which set selector
{
	const whichSetSelect = document.querySelector<HTMLSelectElement>(
		"#ContactForm-which-set",
	)!;
	Object.entries(SlimeSet).forEach(([_, val]) => {
		whichSetSelect.options.add(new Option(val));
	});
}

// Country selector
{
	const choices = new Choices(document.querySelector("#ContactForm-country")!, {
		placeholder: true,
		placeholderValue: "Select the country or region you reside in",
	});

	choices.setChoices(() =>
		promise.then(() =>
			Object.keys(countries.getAlpha3Codes())
				.map((key) => ({
					value: key,
					label: countries.getName(key, "en"),
				}))
				.filter(
					(x): x is { value: string; label: string } => x.label !== undefined,
				),
		),
	);
	choices.init();
}

let iti: Iti;
// Telephone intl input
{
	const telInput = document.querySelector<HTMLInputElement>(
		"#ContactForm-phone-number",
	)!;
	iti = intlTelInput(telInput, {
		initialCountry: "nl",
		strictMode: true,
		separateDialCode: true,
		containerClass: "field field_group",
		nationalMode: true,
	});
	(async () => {
		await iti.promise;
		{
			const span = document.createElement("span");
			span.classList.add("error");
			span.ariaLive = "polite";
			telInput.parentElement?.prepend(span);
		}
	})();
	const country = document.querySelector<HTMLSelectElement>("#ContactForm-country")!;

	country.addEventListener("change", () => {
		const alpha2 = alpha3ToAlpha2(country.value);
		if (alpha2) iti.setCountry(alpha2);
	});
	telInput.addEventListener("input", () => {
		const parent = telInput.parentElement! as HTMLDivElement;
		const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
		if (telInput.validity.valid || iti.isValidNumber()) {
			textElement.textContent = "";
			parent.classList.remove("invalid");
		} else {
			showError(telInput, textElement, parent);
		}
	});
}

// Error validation
{
	const form = document.querySelector<HTMLFormElement>("#ContactForm")!;
	const inputs = form.querySelectorAll<HTMLInputElement>("input");
	inputs.forEach((i) => {
		i.addEventListener("input", () => {
			const parent = i.parentElement! as HTMLDivElement;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			if (i.validity.valid) {
				textElement.textContent = "";
				parent.classList.remove("invalid");
			} else {
				showError(i, textElement, parent);
			}
		});
		i.addEventListener("invalid", () => {
			const parent = i.parentElement! as HTMLDivElement;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			showError(i, textElement, parent);
		});
	});

	// TODO: Missing selects
	const selects = form.querySelectorAll<HTMLSelectElement>("select");
	const checkEmptySelect = (e: HTMLSelectElement) => {
		if (e.required && !e.value) {
			e.setCustomValidity("You need to choose an option!");
			return true;
		} else {
			e.setCustomValidity("");
			return false;
		}
	};
	selects.forEach((i) => {
		i.addEventListener("change", () => {
			checkEmptySelect(i);
			const parent = i.closest<HTMLDivElement>(".field.field_group")!;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			if (i.validity.valid) {
				textElement.textContent = "";
				parent.classList.remove("invalid");
			} else {
				showError(i, textElement, parent);
			}
		});
		i.addEventListener("invalid", () => {
			checkEmptySelect(i);
			const parent = i.closest<HTMLDivElement>(".field.field_group")!;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			showError(i, textElement, parent);
		});
	});

	const textBoxes = form.querySelectorAll<HTMLTextAreaElement>("textarea");
	textBoxes.forEach((i) => {
		i.addEventListener("input", () => {
			const parent = i.parentElement! as HTMLDivElement;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			if (i.validity.valid) {
				textElement.textContent = "";
				parent.classList.remove("invalid");
			} else {
				showError(i, textElement, parent);
			}
		});
		i.addEventListener("invalid", () => {
			const parent = i.parentElement! as HTMLDivElement;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			showError(i, textElement, parent);
		});
	});

	{
		const postalCodeInput = form.querySelector<HTMLInputElement>(
			"#ContactForm-postal-code",
		)!;
		const evHandler = () => {
			const parent = postalCodeInput.parentElement! as HTMLDivElement;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			if (postalCodeInput.value === "0") {
				postalCodeInput.setCustomValidity("You can't use '0' as a postal code");
			} else {
				postalCodeInput.setCustomValidity("");
			}

			if (postalCodeInput.validity.valid) {
				textElement.textContent = "";
				parent.classList.remove("invalid");
			} else {
				showError(postalCodeInput, textElement, parent);
			}
		};
		postalCodeInput?.addEventListener("input", evHandler);
	}

	{
		const imageFilesInput =
			form.querySelector<HTMLInputElement>("#ContactForm-images")!;

		const evHandler = () => {
			const parent = imageFilesInput.parentElement! as HTMLDivElement;
			const textElement = parent.querySelector<HTMLSpanElement>("span.error")!;
			if (imageFilesInput.files) {
				const size = [...imageFilesInput.files].reduce(
					(prev, cur) => prev + cur.size,
					0,
				);
				if (size < TOTAL_FILE_LIMIT) {
					imageFilesInput.setCustomValidity("");
				} else {
					imageFilesInput.setCustomValidity(
						"The total size of all files is more than 25MB!",
					);
				}
			} else {
				imageFilesInput.setCustomValidity("");
			}
			if (imageFilesInput.validity.valid) {
				textElement.textContent = "";
				parent.classList.remove("invalid");
			} else {
				showError(imageFilesInput, textElement, parent);
			}
		};
		imageFilesInput?.addEventListener("input", evHandler);
	}

	const submitButton = form.querySelector<HTMLButtonElement>(
		'button[type="submit"]',
	)!;
	const successMessage = document.querySelector<HTMLElement>(
		"#ContactForm-Slimevr-Success",
	)!;
	const errorMessage = document.querySelector<HTMLElement>(
		"#ContactForm-Slimevr-Error",
	)!;
	form.addEventListener("submit", (ev) => {
		ev.preventDefault();
		if (submitButton.disabled) return;
		submitButton.disabled = true;
		errorMessage.classList.add("visually-hidden");
		if (!form.checkValidity()) {
			const select = [...selects].find((i) => checkEmptySelect(i));
			if (select) {
				submitButton.disabled = false;
				if (select.id !== "ContactForm-country") {
					select.focus();
				} else {
					select.parentElement?.parentElement?.focus();
				}
			}
			const input = [...inputs].find((i) => !i.validity.valid);
			if (input) {
				submitButton.disabled = false;
				return input.focus();
			}
			const textArea = [...textBoxes].find((i) => !i.validity.valid);
			if (textArea) {
				submitButton.disabled = false;
				return textArea.focus();
			}
			submitButton.disabled = false;
		} else {
			(async () => {
				const formData = new FormData(form);

				// Update phone number to international one
				formData.set("phoneNumber", iti.getNumber());

				try {
					const response = await fetch(
						`${import.meta.env.VITE_FORM_URL}/submit/support`,
						{
							method: "POST",
							// Set the FormData instance as the request body
							body: formData,
						},
					);

					console.log(await response.json());

					successMessage.classList.remove("visually-hidden");
					form.classList.add("visually-hidden");
					successMessage.focus();
				} catch (e) {
					submitButton.disabled = false;

					errorMessage.classList.remove("visually-hidden");
					errorMessage.focus();

					console.error(e);
				}
			})();
		}
	});
}
