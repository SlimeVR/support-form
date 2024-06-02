import { ProblemType, SlimeSet, WarrantyIssue } from "form-types";
import countries from "i18n-iso-countries";
import Choices, { Choice } from "choices.js";
import countryEn from "i18n-iso-countries/langs/en.json";
// import "choices.js/public/assets/styles/base.min.css";
import "choices.js/public/assets/styles/choices.min.css";
import { showError } from "./error";

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
	const orderNo = document.querySelector<HTMLInputElement>("#ContactForm-orderNo")!;
	const orderNoLabel = document.querySelector<HTMLLabelElement>(
		"#ContactForm-orderNo + label",
	)!;

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

		switch (value) {
			case ProblemType.WARRANTY:
				orderNoLabel.innerText = "Order number";
				orderNo.required = true;
				break;
			case ProblemType.OTHER:
				orderNoLabel.innerText = "Order number (optional)";
				orderNo.required = false;
		}
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
				.map((key) => ({ value: key, label: countries.getName(key, "en") }))
				.filter<Choice>((x): x is Choice => x.label !== undefined),
		),
	);
	choices.init();
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
