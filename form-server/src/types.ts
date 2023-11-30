import { CountryName } from "i18n-iso-countries";
import typia, { tags } from "typia";

export enum ProblemType {
	WARRANTY = "Warranty",
	OTHER = "Other",
}

export enum SlimeSet {
	LOWER_BODY_PURPLE = "Purple Lower Body Set (5+0)",
	LOWER_BODY_BLACK = "Black Lower Body Set (5+0)",
	LOWER_BODY_WHITE = "White Lower Body Set (5+0)",
	CORE_PURPLE = "Purple Core Set (5+1)",
	CORE_BLACK = "Black Core Set (5+1)",
	CORE_WHITE = "White Core Set (5+1)",
	ENHANCED_CORE_PURPLE = "Purple Enhanced Core Set (5+3)",
	ENHANCED_CORE_BLACK = "Black Enhanced Core Set (5+3)",
	ENHANCED_CORE_WHITE = "White Enhanced Core Set (5+3)",
	FULLBODY_PURPLE = "Purple Full-Body Set (7+3)",
	FULLBODY_BLACK = "Black Full-Body Set (7+3)",
	FULLBODY_WHITE = "White Full-Body Set (7+3)",
	DELUXE_TRACKER_PURPLE = "Purple Deluxe Tracker Set (10+6)",
	DELUXE_TRACKER_BLACK = "Black Deluxe Tracker Set (10+6)",
	DELUXE_TRACKER_WHITE = "White Deluxe Tracker Set (10+6)",
}

export interface SupportFormBase {
	email: string & tags.Format<"email">;
	name: string & tags.MinLength<1> & tags.MaxLength<100>;
	images: File[];
	problem: ProblemType;
	orderNo?: string;
	subject: string & tags.MinLength<1> & tags.MaxLength<60>;
	description: string & tags.MinLength<1> & tags.MaxLength<1000>;
	"cf-turnstile-response": string;
}

export enum WarrantyIssue {
	BLOD = "Blue light of Death",
	BROKEN_EXT_CABLE = "Broken extension cable",
	MISSING_PARTS = "Missing parts in set",
	BROKEN_TRACKER_CASE = "Broken tracker case",
	OTHER = "Other",
}

export interface SupportFormWarranty extends SupportFormBase, ShippingAddress {
	problem: ProblemType.WARRANTY;
	orderNo: string;
	warrantyIssue: WarrantyIssue;
	whichSet?: SlimeSet;
}

export interface ShippingAddress {
	country: string;
	address: string;
	secondAddress: string;
	province?: string;
	city: string;
	postalCode: string;
	phoneNumber: string;
}

export interface SupportFormOther extends SupportFormBase {
	problem: ProblemType.OTHER;
}

export type SupportForm = SupportFormWarranty | SupportFormOther;

export const checkSupportForm = typia.createIs<SupportForm>();
