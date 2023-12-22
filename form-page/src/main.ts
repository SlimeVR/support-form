import { ProblemType, SlimeSet, WarrantyIssue } from "form-types";

{
	const problemSelect = document.querySelector<HTMLSelectElement>("#slimeform-problem")!;
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
				orderNoLabel.innerText = "Order number *";
				orderNo.required = true;
				break;
			case ProblemType.OTHER:
				orderNoLabel.innerText = "Order number";
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

{
	const warrantySelect = document.querySelector<HTMLSelectElement>("#slimeform-warranty-issue")!;
	Object.entries(WarrantyIssue).forEach(([_, val]) => {
		warrantySelect.options.add(new Option(val));
	});
}

{
	const whichSetSelect = document.querySelector<HTMLSelectElement>("#slimeform-which-set")!
	Object.entries(SlimeSet).forEach(([_, val]) => {
		whichSetSelect.options.add(new Option(val));
	});
}
