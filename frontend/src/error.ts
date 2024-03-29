export function showError(
	input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
	errorContent: HTMLSpanElement,
	parent: HTMLDivElement,
) {
	parent.classList.add("invalid");
	if (input.validity.valueMissing) {
		errorContent.textContent = `You need to fill this one out!`;
	} else if (input.validity.typeMismatch) {
		switch (input.type.toLowerCase()) {
			case "email":
				errorContent.textContent = "Needs to be a valid email";
				break;
			case "tel":
				errorContent.textContent = "Needs to be a valid phone number";
				break;
			default:
				errorContent.textContent = "This needs to be a valid type";
		}
	} else if (input.validity.patternMismatch) {
		switch (input.name) {
			case "name":
				errorContent.textContent = "Needs to be a valid name";
				break;
			case "orderNo":
				errorContent.textContent = "Needs to be a CS/Shopify order number";
				break;
			case "phoneNumber":
				errorContent.textContent = "Needs to be a valid phone number";
				break;
			default:
				errorContent.textContent = "This needs to be a valid type";
		}
	} else if (input.validity.tooLong) {
		errorContent.textContent = `This needs to be ${(input as HTMLInputElement).maxLength} characters or less!`;
	} else if (input.validity.tooShort) {
		errorContent.textContent = `This needs to be ${(input as HTMLInputElement).minLength} characters or more!`;
	} else if (input.validity.rangeOverflow) {
		errorContent.textContent = `This needs to be a value less than ${(input as HTMLInputElement).max}`;
	} else if (input.validity.rangeUnderflow) {
		errorContent.textContent = `This needs to be a value bigger than ${(input as HTMLInputElement).min}`;
	}
}
