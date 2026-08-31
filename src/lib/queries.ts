import "server-only";

import { getSupabaseAdmin } from "./supabase/admin";
import { splitEvenly } from "./money";
import type { Expense, Member, Receipt, Settlement } from "./types";

/**
 * All read/write functions the app uses. Server-only. Every function returns
 * plain domain types (`Member`, `Expense`, ...) so callers stay decoupled
 * from Supabase specifics.
 */

// ─── members ────────────────────────────────────────────────────────────────

export async function listMembers(): Promise<Member[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select("*")
    .is("deactivated_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function getMemberByFirstName(
  firstName: string,
): Promise<Member | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select("*")
    .eq("first_name", firstName.toLowerCase())
    .is("deactivated_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as Member | null) ?? null;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Member | null) ?? null;
}

export async function addMember(input: {
  first_name: string;
  display_name: string;
  email?: string | null;
  avatar_color?: string | null;
}): Promise<Member> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("members")
    .insert({
      first_name: input.first_name.toLowerCase(),
      display_name: input.display_name,
      email: input.email ?? null,
      avatar_color: input.avatar_color ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Member;
}

// ─── expenses ───────────────────────────────────────────────────────────────

export async function listExpenses(opts?: {
  month?: string; // "YYYY-MM"
}): Promise<Expense[]> {
  const db = getSupabaseAdmin();
  let q = db
    .from("expenses")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false });
  if (opts?.month) {
    q = q.gte("date", `${opts.month}-01`).lte("date", `${opts.month}-31`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Expense[];
}

export async function addExpense(input: {
  date: string;
  paid_by: string;
  description: string;
  category: string;
  amount_cents: number;
  note?: string | null;
  created_by: string;
}): Promise<Expense> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("expenses")
    .insert({
      date: input.date,
      paid_by: input.paid_by,
      description: input.description,
      category: input.category,
      amount_cents: input.amount_cents,
      note: input.note ?? null,
      created_by: input.created_by,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(
  expenseId: string,
  deletedBy: string,
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("expenses")
    .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
    .eq("id", expenseId);
  if (error) throw error;
}

// ─── receipts ───────────────────────────────────────────────────────────────

export async function listReceiptsForExpenses(
  expenseIds: string[],
): Promise<Receipt[]> {
  if (expenseIds.length === 0) return [];
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("receipts")
    .select("*")
    .in("expense_id", expenseIds);
  if (error) throw error;
  return (data ?? []) as Receipt[];
}

export async function addReceipt(input: {
  expense_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
}): Promise<Receipt> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("receipts")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Receipt;
}

// ─── settlements ────────────────────────────────────────────────────────────

export async function listSettlementsForMonth(
  month: string,
): Promise<Settlement[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("settlements")
    .select("*")
    .eq("month", month);
  if (error) throw error;
  return (data ?? []) as Settlement[];
}

export async function markSettlementPaid(
  settlementId: string,
  memberId: string,
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("settlements")
    .update({
      marked_paid_at: new Date().toISOString(),
      marked_paid_by: memberId,
    })
    .eq("id", settlementId);
  if (error) throw error;
}

// ─── aggregate: monthly summary ─────────────────────────────────────────────

export type MonthSummary = {
  month: string;
  headcount: number;
  totalCents: number;
  yourShareCents: number;
  youFrontedCents: number;
  youreOwedCents: number;
  waitingOn: { member: Member; cents: number }[];
  expenses: Expense[];
};

export async function getMonthSummary(
  month: string,
  meId: string,
): Promise<MonthSummary> {
  const [members, expenses] = await Promise.all([
    listMembers(),
    listExpenses({ month }),
  ]);
  const headcount = Math.max(1, members.length);
  const totalCents = expenses.reduce((a, e) => a + e.amount_cents, 0);
  const yourShareCents = splitEvenly(totalCents, headcount)[0];
  const youFrontedCents = expenses
    .filter((e) => e.paid_by === meId)
    .reduce((a, e) => a + e.amount_cents, 0);
  const youreOwedCents = youFrontedCents - yourShareCents;

  // "Waiting on" = for each expense I paid, how much does each other member
  // owe me? Sum per member.
  const meIndex = members.findIndex((m) => m.id === meId);
  const waitingMap = new Map<string, number>();
  for (const e of expenses) {
    if (e.paid_by !== meId) continue;
    const shares = splitEvenly(e.amount_cents, headcount);
    members.forEach((m, i) => {
      if (m.id === meId) return;
      const share = shares[i] ?? shares[0];
      waitingMap.set(m.id, (waitingMap.get(m.id) ?? 0) + share);
    });
  }
  const waitingOn = Array.from(waitingMap.entries())
    .map(([id, cents]) => ({
      member: members.find((m) => m.id === id)!,
      cents,
    }))
    .filter((r) => r.cents > 0)
    .sort((a, b) => b.cents - a.cents);

  return {
    month,
    headcount,
    totalCents,
    yourShareCents,
    youFrontedCents,
    youreOwedCents,
    waitingOn,
    expenses,
  };
}
