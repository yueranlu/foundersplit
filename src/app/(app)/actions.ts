"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireMember } from "@/lib/auth";
import { addExpense, addMember, addPayment, deleteExpense } from "@/lib/queries";
import { parseDollarsToCents } from "@/lib/money";
import type { ExpenseCategory, PaymentMethod } from "@/lib/types";

const CATEGORIES: ExpenseCategory[] = [
  "software", "hosting", "legal", "accounting", "marketing", "travel",
  "meals", "hardware", "contractors", "fees", "other",
];
const METHODS: PaymentMethod[] = ["e_transfer", "venmo", "cash", "other"];

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/login");
}

// ─── expenses ───────────────────────────────────────────────────────────────

export async function createExpense(formData: FormData): Promise<void> {
  const me = await requireMember();

  const date = String(formData.get("date") ?? "").trim();
  const paid_by = String(formData.get("paid_by") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "other").trim();
  const amountStr = String(formData.get("amount") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!date) throw new Error("Pick a date.");
  if (!paid_by) throw new Error("Who paid?");
  if (!description) throw new Error("Describe the expense.");
  if (!CATEGORIES.includes(category as ExpenseCategory)) {
    throw new Error("Pick a valid category.");
  }
  const amount_cents = parseDollarsToCents(amountStr);
  if (amount_cents === null || amount_cents <= 0) {
    throw new Error("Enter an amount greater than $0.");
  }

  await addExpense({
    date,
    paid_by,
    description,
    category,
    amount_cents,
    note: note || null,
    created_by: me.id,
  });

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/bills");
}

export async function removeExpense(formData: FormData): Promise<void> {
  const me = await requireMember();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing expense id.");
  await deleteExpense(id, me.id);
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/bills");
}

// ─── payments ───────────────────────────────────────────────────────────────

export async function createPayment(formData: FormData): Promise<void> {
  const me = await requireMember();

  const from_member_id = String(formData.get("from_member_id") ?? "");
  const to_member_id = String(formData.get("to_member_id") ?? "");
  const amountStr = String(formData.get("amount") ?? "");
  const method = String(formData.get("method") ?? "other") as PaymentMethod;
  const note = String(formData.get("note") ?? "").trim();

  if (!from_member_id || !to_member_id) {
    throw new Error("Missing payer or receiver.");
  }
  if (from_member_id === to_member_id) {
    throw new Error("Payer and receiver can't be the same person.");
  }
  if (!METHODS.includes(method)) throw new Error("Pick a payment method.");

  const amount_cents = parseDollarsToCents(amountStr);
  if (amount_cents === null || amount_cents <= 0) {
    throw new Error("Enter an amount greater than $0.");
  }

  await addPayment({
    from_member_id,
    to_member_id,
    amount_cents,
    method,
    note: note || null,
    created_by: me.id,
  });

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/bills");
  redirect("/");
}

// ─── team ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#f97316", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6",
  "#eab308", "#06b6d4", "#f43f5e", "#84cc16", "#a855f7",
];

export async function createMember(formData: FormData): Promise<void> {
  await requireMember();

  const display_name = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const first_name = display_name.toLowerCase().split(/\s+/)[0];

  if (!first_name || first_name.length < 2) {
    throw new Error("Give them a name at least 2 characters long.");
  }

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  await addMember({
    first_name,
    display_name,
    email: email || null,
    avatar_color: color,
  });

  revalidatePath("/team");
  revalidatePath("/");
}
