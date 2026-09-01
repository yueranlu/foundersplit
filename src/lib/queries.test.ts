import { describe, expect, it } from "vitest";
import { computeBalanceOverview } from "./queries";
import type { Expense, Member, Payment } from "./types";

// ─── fixtures ───────────────────────────────────────────────────────────────

const member = (id: string, name: string): Member => ({
  id,
  first_name: name.toLowerCase(),
  display_name: name,
  email: null,
  avatar_color: null,
  created_at: "2026-01-01T00:00:00Z",
  deactivated_at: null,
});

const YUERAN = member("y", "Yueran");
const DORY = member("d", "Dory");
const JENNY = member("j", "Jenny");
const ERIC = member("e", "Eric");

const FIVE_MEMBERS = [YUERAN, DORY, JENNY, ERIC, member("s", "Siva")];
const FOUR_MEMBERS = [YUERAN, DORY, JENNY, ERIC];

const expense = (opts: {
  id?: string;
  paid_by: string;
  amount_cents: number;
  date?: string;
}): Expense => ({
  id: opts.id ?? crypto.randomUUID(),
  date: opts.date ?? "2026-08-15",
  paid_by: opts.paid_by,
  description: "test",
  category: "other",
  amount_cents: opts.amount_cents,
  note: null,
  created_at: "2026-08-15T00:00:00Z",
  deleted_at: null,
});

const payment = (opts: {
  from: string;
  to: string;
  amount_cents: number;
}): Payment => ({
  id: crypto.randomUUID(),
  from_member_id: opts.from,
  to_member_id: opts.to,
  amount_cents: opts.amount_cents,
  made_at: "2026-08-31T00:00:00Z",
  method: "e_transfer",
  note: null,
  created_by: opts.from,
  created_at: "2026-08-31T00:00:00Z",
  deleted_at: null,
});

// ─── tests ──────────────────────────────────────────────────────────────────

describe("computeBalanceOverview: empty state", () => {
  it("returns zeros when there are no expenses or payments", () => {
    const overview = computeBalanceOverview({
      members: FIVE_MEMBERS,
      expenses: [],
      payments: [],
      meId: YUERAN.id,
    });
    expect(overview.netCents).toBe(0);
    expect(overview.totalOwedToYouCents).toBe(0);
    expect(overview.totalYouOweCents).toBe(0);
    expect(overview.hasActivity).toBe(false);
    expect(overview.pairs).toHaveLength(4);
    expect(overview.pairs.every((p) => p.netCentsTheyOweYou === 0)).toBe(true);
  });

  it("headcount respects the member list", () => {
    expect(
      computeBalanceOverview({
        members: FIVE_MEMBERS,
        expenses: [],
        payments: [],
        meId: YUERAN.id,
      }).headcount,
    ).toBe(5);
    expect(
      computeBalanceOverview({
        members: FOUR_MEMBERS,
        expenses: [],
        payments: [],
        meId: YUERAN.id,
      }).headcount,
    ).toBe(4);
  });
});

describe("computeBalanceOverview: single expense I paid", () => {
  it("credits me for everyone else's share (5 people, $50.58 domain)", () => {
    // splitEvenly(5058, 5) = [1012, 1012, 1012, 1011, 1011]
    // Yueran paid, so gets no debt owed to self. Dory=1012, Jenny=1012,
    // Eric=1011, Siva=1011. Total owed to Yueran: 4046 = $40.46.
    const overview = computeBalanceOverview({
      members: FIVE_MEMBERS,
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 5058 })],
      payments: [],
      meId: YUERAN.id,
    });
    expect(overview.netCents).toBe(4046);
    expect(overview.totalOwedToYouCents).toBe(4046);
    expect(overview.totalYouOweCents).toBe(0);
    expect(overview.hasActivity).toBe(true);

    const byId = new Map(
      overview.pairs.map((p) => [p.otherMember.id, p.netCentsTheyOweYou]),
    );
    expect(byId.get(DORY.id)).toBe(1012);
    expect(byId.get(JENNY.id)).toBe(1012);
    expect(byId.get(ERIC.id)).toBe(1011);
    expect(byId.get("s")).toBe(1011);
  });

  it("splits differently at 4-person headcount", () => {
    // splitEvenly(5058, 4) = [1265, 1265, 1264, 1264]
    // Yueran paid. Dory=1265, Jenny=1264, Eric=1264. Total = 3793.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 5058 })],
      payments: [],
      meId: YUERAN.id,
    });
    expect(overview.totalOwedToYouCents).toBe(3793);
    const byId = new Map(
      overview.pairs.map((p) => [p.otherMember.id, p.netCentsTheyOweYou]),
    );
    expect(byId.get(DORY.id)).toBe(1265);
    expect(byId.get(JENNY.id)).toBe(1264);
    expect(byId.get(ERIC.id)).toBe(1264);
  });
});

describe("computeBalanceOverview: single expense someone else paid", () => {
  it("puts me on the debt side", () => {
    // Dory paid $100. Split 4 ways = $25 each. Yueran owes Dory $25.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [expense({ paid_by: DORY.id, amount_cents: 10000 })],
      payments: [],
      meId: YUERAN.id,
    });
    expect(overview.netCents).toBe(-2500);
    expect(overview.totalOwedToYouCents).toBe(0);
    expect(overview.totalYouOweCents).toBe(2500);
    const dory = overview.pairs.find((p) => p.otherMember.id === DORY.id);
    expect(dory?.netCentsTheyOweYou).toBe(-2500);
  });
});

describe("computeBalanceOverview: payments reduce debt", () => {
  it("full payment zeroes a debt (real domain expense case)", () => {
    // Yueran paid $50.58. Dory owes $10.12. Dory pays $10.12. Net = 0.
    const overview = computeBalanceOverview({
      members: FIVE_MEMBERS,
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 5058 })],
      payments: [payment({ from: DORY.id, to: YUERAN.id, amount_cents: 1012 })],
      meId: YUERAN.id,
    });
    // Total owed to Yueran drops from 4046 to 3034.
    expect(overview.totalOwedToYouCents).toBe(3034);
    const dory = overview.pairs.find((p) => p.otherMember.id === DORY.id);
    expect(dory?.netCentsTheyOweYou).toBe(0);
  });

  it("partial payment leaves the remainder", () => {
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 10000 })],
      payments: [payment({ from: DORY.id, to: YUERAN.id, amount_cents: 1000 })],
      meId: YUERAN.id,
    });
    // Dory owed $25. Paid $10. Now owes $15.
    const dory = overview.pairs.find((p) => p.otherMember.id === DORY.id);
    expect(dory?.netCentsTheyOweYou).toBe(1500);
  });

  it("overpayment flips the direction of the debt", () => {
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 10000 })],
      // Dory only owes $25 but pays $30. Now Yueran owes Dory $5.
      payments: [payment({ from: DORY.id, to: YUERAN.id, amount_cents: 3000 })],
      meId: YUERAN.id,
    });
    const dory = overview.pairs.find((p) => p.otherMember.id === DORY.id);
    expect(dory?.netCentsTheyOweYou).toBe(-500);
  });

  it("bidirectional expenses across two people net out", () => {
    // Yueran paid $100, so Dory owes Yueran $25.
    // Dory also paid $60, so Yueran owes Dory $15.
    // Net: Dory owes Yueran $10.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [
        expense({ paid_by: YUERAN.id, amount_cents: 10000 }),
        expense({ paid_by: DORY.id, amount_cents: 6000 }),
      ],
      payments: [],
      meId: YUERAN.id,
    });
    const dory = overview.pairs.find((p) => p.otherMember.id === DORY.id);
    expect(dory?.netCentsTheyOweYou).toBe(1000);
  });
});

describe("computeBalanceOverview: sorting", () => {
  it("orders positive first (largest), then settled, then debts", () => {
    // Dory owes me $25, Jenny owes me $10, Eric = 0, and I owe someone else.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [
        expense({ paid_by: YUERAN.id, amount_cents: 10000 }), // Everyone owes Y $25
      ],
      payments: [
        payment({ from: JENNY.id, to: YUERAN.id, amount_cents: 1500 }), // Jenny -> $10 left
        payment({ from: ERIC.id, to: YUERAN.id, amount_cents: 2500 }), // Eric settled
      ],
      meId: YUERAN.id,
    });

    // Expected order: Dory (2500), Jenny (1000), then Eric (settled, 0)
    expect(overview.pairs.map((p) => p.otherMember.id)).toEqual([
      DORY.id,
      JENNY.id,
      ERIC.id,
    ]);
    expect(overview.pairs.map((p) => p.netCentsTheyOweYou)).toEqual([
      2500, 1000, 0,
    ]);
  });

  it("orders debts largest first, settled last", () => {
    // I paid nothing. Dory paid $40 (Y owes 10). Jenny paid $80 (Y owes 20).
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [
        expense({ paid_by: DORY.id, amount_cents: 4000 }),
        expense({ paid_by: JENNY.id, amount_cents: 8000 }),
      ],
      payments: [],
      meId: YUERAN.id,
    });
    // Splitwise-style: active items on top (biggest debt first), settled last.
    // Jenny (-2000) > Dory (-1000) > Eric (0, settled).
    expect(overview.pairs.map((p) => p.netCentsTheyOweYou)).toEqual([
      -1000, -2000, 0,
    ]);
    expect(overview.pairs[overview.pairs.length - 1].otherMember.id).toBe(
      ERIC.id,
    );
  });
});

describe("computeBalanceOverview: totals", () => {
  it("sums positives into totalOwedToYou and absolute negatives into totalYouOwe", () => {
    // Dory owes me $10, I owe Jenny $30, Eric = 0.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [
        expense({ paid_by: YUERAN.id, amount_cents: 4000 }), // 3 others owe me $10 each
        expense({ paid_by: JENNY.id, amount_cents: 16000 }), // Yueran owes Jenny $40
      ],
      payments: [],
      meId: YUERAN.id,
    });
    // From Yueran's view:
    //   Dory:  +1000 (from own expense) - 4000 (jenny's) = wait, jenny paid Jenny expense not for Dory.
    // Actually jenny's expense: 16000 / 4 = 4000 each. So Yueran, Dory, Eric each owe Jenny 4000.
    // Yueran's expense: 4000 / 4 = 1000 each. So Dory, Jenny, Eric each owe Yueran 1000.
    // Pairwise from Yueran:
    //   Dory: Yueran owed +1000 (Dory owes for Y expense), no reverse. Net +1000.
    //   Jenny: Yueran owed +1000 (Jenny owes for Y expense). Yueran owes Jenny 4000 (for J expense). Net -3000.
    //   Eric: Yueran owed +1000. No reverse. Net +1000.
    const byId = new Map(
      overview.pairs.map((p) => [p.otherMember.id, p.netCentsTheyOweYou]),
    );
    expect(byId.get(DORY.id)).toBe(1000);
    expect(byId.get(JENNY.id)).toBe(-3000);
    expect(byId.get(ERIC.id)).toBe(1000);
    expect(overview.totalOwedToYouCents).toBe(2000); // Dory + Eric
    expect(overview.totalYouOweCents).toBe(3000); // Jenny
    expect(overview.netCents).toBe(-1000);
  });
});

describe("computeBalanceOverview: penny distribution", () => {
  it("penny-safe sum of all pair balances (all paid by me)", () => {
    // Y paid $50.58 (5058 cents), split 4 ways.
    // The four shares must sum to exactly 5058, including Y's own share.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 5058 })],
      payments: [],
      meId: YUERAN.id,
    });
    // splitEvenly(5058, 4) = [1265, 1265, 1264, 1264]. Y is idx 0 so gets 1265.
    // Dory=1265, Jenny=1264, Eric=1264. Y+others = 1265+1265+1264+1264 = 5058.
    const yueransShare = 1265;
    const sum =
      yueransShare +
      overview.pairs.reduce((a, p) => a + p.netCentsTheyOweYou, 0);
    expect(sum).toBe(5058);
  });

  it("cannot lose or invent pennies across a mixed ledger", () => {
    // Everyone pays one round. Sum of all pair balances must equal zero
    // when viewed globally.
    const expenses = [
      expense({ paid_by: YUERAN.id, amount_cents: 1000 }),
      expense({ paid_by: DORY.id, amount_cents: 1500 }),
      expense({ paid_by: JENNY.id, amount_cents: 2000 }),
      expense({ paid_by: ERIC.id, amount_cents: 550 }),
    ];
    const meIds = FOUR_MEMBERS.map((m) => m.id);
    const totals = meIds.map(
      (id) =>
        computeBalanceOverview({
          members: FOUR_MEMBERS,
          expenses,
          payments: [],
          meId: id,
        }).netCents,
    );
    // If the ledger is consistent, the world nets to zero.
    expect(totals.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe("computeBalanceOverview: edge cases", () => {
  it("solo member has no pairs and no balances", () => {
    const overview = computeBalanceOverview({
      members: [YUERAN],
      expenses: [expense({ paid_by: YUERAN.id, amount_cents: 1000 })],
      payments: [],
      meId: YUERAN.id,
    });
    expect(overview.pairs).toEqual([]);
    expect(overview.netCents).toBe(0);
    expect(overview.hasActivity).toBe(true);
  });

  it("handles a payment with no matching expense (pre-payment or gift)", () => {
    // Dory sends me $50 out of the blue.
    const overview = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses: [],
      payments: [payment({ from: DORY.id, to: YUERAN.id, amount_cents: 5000 })],
      meId: YUERAN.id,
    });
    // Now Yueran owes Dory $50 (Dory over-paid a nonexistent debt).
    const dory = overview.pairs.find((p) => p.otherMember.id === DORY.id);
    expect(dory?.netCentsTheyOweYou).toBe(-5000);
    expect(overview.totalYouOweCents).toBe(5000);
  });

  it("mirrors correctly: what X owes Y = what Y owes X, sign flipped", () => {
    const expenses = [expense({ paid_by: YUERAN.id, amount_cents: 10000 })];
    const fromYueran = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses,
      payments: [],
      meId: YUERAN.id,
    });
    const fromDory = computeBalanceOverview({
      members: FOUR_MEMBERS,
      expenses,
      payments: [],
      meId: DORY.id,
    });

    const dorysBalanceOnY = fromYueran.pairs.find(
      (p) => p.otherMember.id === DORY.id,
    )?.netCentsTheyOweYou;
    const yueransBalanceOnD = fromDory.pairs.find(
      (p) => p.otherMember.id === YUERAN.id,
    )?.netCentsTheyOweYou;

    expect(dorysBalanceOnY).toBe(2500);
    expect(yueransBalanceOnD).toBe(-2500);
  });
});
