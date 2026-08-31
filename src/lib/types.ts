/**
 * Domain types for FounderSplit.
 *
 * These are inferred from the deployed app's UI. When the real schema is
 * confirmed, this file is the single place to reconcile; everything else
 * consumes these types.
 */

export type UUID = string;
export type ISODate = string; // "YYYY-MM-DD"
export type ISOMonth = string; // "YYYY-MM"

export type ExpenseCategory =
  | "software"
  | "hosting"
  | "legal"
  | "accounting"
  | "marketing"
  | "travel"
  | "meals"
  | "hardware"
  | "contractors"
  | "fees"
  | "other";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  software: "Software/SaaS",
  hosting: "Hosting/Infra",
  legal: "Legal",
  accounting: "Accounting",
  marketing: "Marketing/Ads",
  travel: "Travel",
  meals: "Meals",
  hardware: "Hardware",
  contractors: "Contractors",
  fees: "Fees/Banking",
  other: "Other",
};

export const CATEGORY_ORDER: ExpenseCategory[] = [
  "software",
  "hosting",
  "legal",
  "accounting",
  "marketing",
  "travel",
  "meals",
  "hardware",
  "contractors",
  "fees",
  "other",
];

export interface Member {
  id: UUID;
  first_name: string; // lowercase, unique — login credential
  display_name: string; // e.g. "Yueran"
  email: string | null;
  avatar_color: string | null;
  created_at: string;
  deactivated_at: string | null;
}

export interface Expense {
  id: UUID;
  date: ISODate;
  paid_by: UUID;
  description: string;
  category: ExpenseCategory;
  amount_cents: number;
  note: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Receipt {
  id: UUID;
  expense_id: UUID;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface Settlement {
  id: UUID;
  month: ISOMonth;
  from_member_id: UUID;
  to_member_id: UUID;
  amount_cents: number;
  marked_paid_at: string | null;
  marked_paid_by: UUID | null;
  created_at: string;
}
