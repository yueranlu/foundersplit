import "server-only";

import { getSupabaseAdmin } from "./supabase/admin";
import { splitEvenly } from "./money";
import type {
  Expense,
  Member,
  Payment,
  PaymentMethod,
  Receipt,
} from "./types";

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
  limit?: number;
}): Promise<Expense[]> {
  const db = getSupabaseAdmin();
  let q = db
    .from("expenses")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (opts?.month) {
    q = q.gte("date", `${opts.month}-01`).lte("date", `${opts.month}-31`);
  }
  if (opts?.limit) q = q.limit(opts.limit);
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

// ─── payments ───────────────────────────────────────────────────────────────

export async function listPayments(opts?: {
  limit?: number;
}): Promise<Payment[]> {
  const db = getSupabaseAdmin();
  let q = db
    .from("payments")
    .select("*")
    .is("deleted_at", null)
    .order("made_at", { ascending: false });
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function addPayment(input: {
  from_member_id: string;
  to_member_id: string;
  amount_cents: number;
  method: PaymentMethod;
  note?: string | null;
  created_by: string;
  made_at?: string;
}): Promise<Payment> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("payments")
    .insert({
      from_member_id: input.from_member_id,
      to_member_id: input.to_member_id,
      amount_cents: input.amount_cents,
      method: input.method,
      note: input.note ?? null,
      created_by: input.created_by,
      made_at: input.made_at ?? new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function deletePayment(
  paymentId: string,
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", paymentId);
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

// ─── Splitwise-style balances ───────────────────────────────────────────────

/**
 * Net amount `debtor` owes `creditor` across all time.
 * Positive: debtor owes creditor that much.
 * Negative: creditor owes debtor.
 * Zero: settled.
 *
 * All amounts are integer cents; splitEvenly() distributes leftover pennies
 * one-per-person, so the sums always match the total exactly.
 */
export type PairBalance = {
  otherMember: Member;
  netCentsTheyOweYou: number; // positive: they owe you. negative: you owe them.
};

export type BalanceOverview = {
  headcount: number;
  members: Member[];
  totalOwedToYouCents: number; // sum of positive pair balances
  totalYouOweCents: number; // sum of negative pair balances (absolute)
  netCents: number; // signed net across all others
  pairs: PairBalance[]; // sorted: largest owed to you first, then you owe
  hasActivity: boolean;
};

export async function getBalanceOverview(
  meId: string,
): Promise<BalanceOverview> {
  const [members, expenses, payments] = await Promise.all([
    listMembers(),
    listExpenses(),
    listPayments(),
  ]);

  const headcount = Math.max(1, members.length);
  const memberIndex = new Map(members.map((m, i) => [m.id, i]));

  // Pairwise ledger: ledger[A][B] = how much B owes A (net, at cents precision).
  const ledger = new Map<string, Map<string, number>>();
  const bump = (creditor: string, debtor: string, cents: number) => {
    if (creditor === debtor) return;
    if (!ledger.has(creditor)) ledger.set(creditor, new Map());
    const row = ledger.get(creditor)!;
    row.set(debtor, (row.get(debtor) ?? 0) + cents);
  };

  // For each expense, everyone in the team (except the payer) owes the payer
  // their share. Pennies distributed by splitEvenly().
  for (const exp of expenses) {
    const shares = splitEvenly(exp.amount_cents, headcount);
    members.forEach((debtor, i) => {
      if (debtor.id === exp.paid_by) return;
      const share = shares[i] ?? shares[0];
      bump(exp.paid_by, debtor.id, share);
    });
  }

  // Payments: from_member paid to_member. This reduces what from_member owes
  // to_member (or grows what to_member owes from_member — same coin).
  for (const p of payments) {
    // to_member is creditor; from_member is debtor paying down their debt.
    // Reduce ledger[to_member][from_member] by the amount.
    bump(p.to_member_id, p.from_member_id, -p.amount_cents);
  }

  // Collapse per pair to a single net number: what each other owes me.
  const pairs: PairBalance[] = members
    .filter((m) => m.id !== meId)
    .map((other) => {
      const theyOweMe = ledger.get(meId)?.get(other.id) ?? 0;
      const iOweThem = ledger.get(other.id)?.get(meId) ?? 0;
      const net = theyOweMe - iOweThem;
      return { otherMember: other, netCentsTheyOweYou: net };
    })
    .sort((a, b) => {
      // Positive (owed to you) first, largest first.
      // Then zero (settled), then negative (you owe), largest debt first.
      const aRank = a.netCentsTheyOweYou;
      const bRank = b.netCentsTheyOweYou;
      if (aRank === 0 && bRank !== 0) return 1;
      if (bRank === 0 && aRank !== 0) return -1;
      if (aRank > 0 && bRank <= 0) return -1;
      if (bRank > 0 && aRank <= 0) return 1;
      return bRank - aRank;
    });

  const totalOwedToYouCents = pairs
    .filter((p) => p.netCentsTheyOweYou > 0)
    .reduce((a, p) => a + p.netCentsTheyOweYou, 0);
  const totalYouOweCents = pairs
    .filter((p) => p.netCentsTheyOweYou < 0)
    .reduce((a, p) => a - p.netCentsTheyOweYou, 0);
  const netCents = totalOwedToYouCents - totalYouOweCents;
  const hasActivity = expenses.length > 0 || payments.length > 0;

  return {
    headcount,
    members,
    totalOwedToYouCents,
    totalYouOweCents,
    netCents,
    pairs,
    hasActivity,
  };
}

/** Get the current net for a single pair. Used by the settle-up screen. */
export async function getPairBalance(
  meId: string,
  otherId: string,
): Promise<number> {
  const overview = await getBalanceOverview(meId);
  const pair = overview.pairs.find((p) => p.otherMember.id === otherId);
  return pair?.netCentsTheyOweYou ?? 0;
}

// ─── activity feed: merged expenses + payments ──────────────────────────────

export type ActivityItem =
  | { kind: "expense"; at: string; expense: Expense }
  | { kind: "payment"; at: string; payment: Payment };

export async function listActivity(opts?: {
  limit?: number;
}): Promise<ActivityItem[]> {
  const [expenses, payments] = await Promise.all([
    listExpenses(),
    listPayments(),
  ]);
  const items: ActivityItem[] = [
    ...expenses.map((e) => ({
      kind: "expense" as const,
      at: e.created_at,
      expense: e,
    })),
    ...payments.map((p) => ({
      kind: "payment" as const,
      at: p.made_at,
      payment: p,
    })),
  ];
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return opts?.limit ? items.slice(0, opts.limit) : items;
}
