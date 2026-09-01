// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityRow } from "./activity-row";
import type { Member } from "@/lib/types";
import type { ActivityItem } from "@/lib/queries";

const members: Member[] = [
  { id: "y", first_name: "yueran", display_name: "Yueran", email: null, avatar_color: null, created_at: "", deactivated_at: null },
  { id: "d", first_name: "dory", display_name: "Dory", email: null, avatar_color: null, created_at: "", deactivated_at: null },
];

describe("<ActivityRow /> expense variant", () => {
  const item: ActivityItem = {
    kind: "expense",
    at: "2026-08-15T12:00:00Z",
    expense: {
      id: "e1",
      date: "2026-08-15",
      paid_by: "d",
      description: "Domain (miluo.ca)",
      category: "other",
      amount_cents: 5058,
      note: null,
      created_at: "2026-08-15T12:00:00Z",
      deleted_at: null,
    },
  };

  it("shows the expense description", () => {
    render(<ActivityRow item={item} members={members} meId="y" />);
    expect(screen.getByText("Domain (miluo.ca)")).toBeInTheDocument();
  });

  it("labels 'You paid' when the current user is the payer", () => {
    const mine = {
      ...item,
      expense: { ...item.expense, paid_by: "y" },
    };
    render(<ActivityRow item={mine} members={members} meId="y" />);
    expect(screen.getByText(/You paid/i)).toBeInTheDocument();
  });

  it("uses another member's name when they paid", () => {
    render(<ActivityRow item={item} members={members} meId="y" />);
    expect(screen.getByText(/Dory paid/i)).toBeInTheDocument();
  });

  it("renders the total and per-person share formatted with $", () => {
    render(<ActivityRow item={item} members={members} meId="y" />);
    // Total: $50.58 (headcount is 2 so per person = $25.29)
    expect(screen.getByText("$50.58")).toBeInTheDocument();
    expect(screen.getByText("$25.29 each")).toBeInTheDocument();
  });
});

describe("<ActivityRow /> payment variant", () => {
  const item: ActivityItem = {
    kind: "payment",
    at: "2026-08-31T00:00:00Z",
    payment: {
      id: "p1",
      from_member_id: "d",
      to_member_id: "y",
      amount_cents: 1012,
      made_at: "2026-08-31T00:00:00Z",
      method: "e_transfer",
      note: null,
      created_by: "d",
      created_at: "2026-08-31T00:00:00Z",
      deleted_at: null,
    },
  };

  it("shows 'X paid you' when the current user is the receiver", () => {
    render(<ActivityRow item={item} members={members} meId="y" />);
    expect(screen.getByText(/Dory paid you/i)).toBeInTheDocument();
  });

  it("shows 'You paid Y' when the current user is the sender", () => {
    const sent: ActivityItem = {
      kind: "payment",
      at: item.at,
      payment: {
        ...item.payment,
        from_member_id: "y",
        to_member_id: "d",
      },
    };
    render(<ActivityRow item={sent} members={members} meId="y" />);
    expect(screen.getByText(/You paid Dory/i)).toBeInTheDocument();
  });

  it("shows the payment method label (e-Transfer)", () => {
    render(<ActivityRow item={item} members={members} meId="y" />);
    expect(screen.getByText(/e-Transfer/i)).toBeInTheDocument();
  });

  it("renders the amount formatted", () => {
    render(<ActivityRow item={item} members={members} meId="y" />);
    expect(screen.getByText("$10.12")).toBeInTheDocument();
  });

  it("shows a note when one is present", () => {
    const withNote: ActivityItem = {
      kind: "payment",
      at: item.at,
      payment: { ...item.payment, note: "Settling August" },
    };
    render(<ActivityRow item={withNote} members={members} meId="y" />);
    expect(screen.getByText(/Settling August/)).toBeInTheDocument();
  });
});
