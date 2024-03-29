import { tags } from "typia";
import { Alpha3Code } from "i18n-iso-countries";
import { TagBase } from "typia/lib/tags/TagBase.js";

export type UnicodePattern<Value extends string> = TagBase<{
    target: "string";
    kind: "unicodePattern";
    value: Value;
    validate: `/${Value}/v.test($input)`;
    exclusive: ["format", "pattern", "unicodePattern"];
    // schema: {
    //     pattern: Value;
    // };
}>;


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

export const STRING_SET_MAP: Record<string, SlimeSet> = {
	"SLIMEVR-FBT-LBS-P": SlimeSet.LOWER_BODY_PURPLE,
	"SLIMEVR-FBT-LBS-B": SlimeSet.LOWER_BODY_BLACK,
	"SLIMEVR-FBT-LBS-W": SlimeSet.LOWER_BODY_WHITE,
	"SLIMEVR-FBT-CS-P": SlimeSet.CORE_PURPLE,
	"SLIMEVR-FBT-CS-B": SlimeSet.CORE_BLACK,
	"SLIMEVR-FBT-CS-W": SlimeSet.CORE_WHITE,
	"SLIMEVR-FBT-ECS-P": SlimeSet.ENHANCED_CORE_PURPLE,
	"SLIMEVR-FBT-ECS-B": SlimeSet.ENHANCED_CORE_BLACK,
	"SLIMEVR-FBT-ECS-W": SlimeSet.ENHANCED_CORE_WHITE,
	"SLIMEVR-FBT-FBS-P": SlimeSet.FULLBODY_PURPLE,
	"SLIMEVR-FBT-FBS-B": SlimeSet.FULLBODY_BLACK,
	"SLIMEVR-FBT-FBS-W": SlimeSet.FULLBODY_WHITE,
	"SLIMEVR-FBT-DTS-P": SlimeSet.DELUXE_TRACKER_PURPLE,
	"SLIMEVR-FBT-DTS-B": SlimeSet.DELUXE_TRACKER_BLACK,
	"SLIMEVR-FBT-DTS-W": SlimeSet.DELUXE_TRACKER_WHITE,
};

export type OrderNumber = ShopifyOrderNumber | CrowdsupplyOrderNumber;

export type ShopifyOrderNumber = string & tags.Pattern<"^#?(SVR#)?\\d{4,}S$"> & tags.MaxLength<20>;
export type CrowdsupplyOrderNumber = string & tags.Pattern<"^\\d+$"> & tags.MaxLength<20>

export interface SupportFormBase {
	email: string & tags.Format<"email"> & tags.MaxLength<100>;
	name: string &
		tags.MinLength<1> &
		tags.MaxLength<100> &
		UnicodePattern<"[\\p{L} \\-\\.]+">;
	images: File[];
	problem: ProblemType;
	orderNo?: OrderNumber | "";
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
	orderNo: OrderNumber;
	warrantyIssue: WarrantyIssue;
	whichSet?: SlimeSet | "";
}

export interface ShippingAddress {
	country: Alpha3Code;
	address: string & tags.MaxLength<200>;
	secondAddress?: string & tags.MaxLength<200>;
	province: string & tags.MaxLength<200>;
	city?: string & tags.MaxLength<200>;
	postalCode?: string & tags.MaxLength<20>;
	phoneNumber: string & tags.MaxLength<30> & tags.Pattern<"[\\d \\-\\+]+">;
}

export interface SupportFormOther extends SupportFormBase {
	problem: ProblemType.OTHER;
}

export type SupportForm = SupportFormWarranty | SupportFormOther;
