import { ProblemType, SlimeSet, WarrantyIssue } from "form-types";
import countries from "i18n-iso-countries";
import Choices, { Choice } from "choices.js";
// import "choices.js/public/assets/styles/base.min.css";
import "choices.js/public/assets/styles/choices.min.css";

// Fetch country names
const promise = (async () => {
	countries.registerLocale(await import("i18n-iso-countries/langs/en.json"));
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
		document.querySelector<HTMLSelectElement>("#slimeform-problem")!;
	const orderNo = document.querySelector<HTMLInputElement>("#slimeform-orderNo")!;
	const orderNoLabel = document.querySelector<HTMLLabelElement>(
		"#slimeform-orderNo + label",
	)!;

	const sections = new Map([
		[
			ProblemType.WARRANTY,
			document.querySelector<HTMLDivElement>("#slimeform-warranty-problem")!,
		],
		[
			ProblemType.OTHER,
			document.querySelector<HTMLDivElement>("#slimeform-other-problem")!,
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
		"#slimeform-warranty-issue",
	)!;
	Object.entries(WarrantyIssue).forEach(([_, val]) => {
		warrantySelect.options.add(new Option(val));
	});
}

// Which set selector
{
	const whichSetSelect =
		document.querySelector<HTMLSelectElement>("#slimeform-which-set")!;
	Object.entries(SlimeSet).forEach(([_, val]) => {
		whichSetSelect.options.add(new Option(val));
	});
}

// Country selector
{
	const choices = new Choices(document.querySelector("#slimeform-country")!, {
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
