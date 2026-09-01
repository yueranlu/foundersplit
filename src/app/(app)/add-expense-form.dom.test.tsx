// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddExpenseForm } from "./add-expense-form";
import type { Member } from "@/lib/types";

// The form uses a server action from "./actions" that hits the DB. Under the
// jsdom test env we don't want to run it; stub it so submit is a no-op.
vi.mock("./actions", () => ({
  createExpense: vi.fn().mockResolvedValue(undefined),
  createPayment: vi.fn().mockResolvedValue(undefined),
  createMember: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  removeExpense: vi.fn().mockResolvedValue(undefined),
}));

const members: Member[] = [
  { id: "y", first_name: "yueran", display_name: "Yueran", email: null, avatar_color: null, created_at: "", deactivated_at: null },
  { id: "d", first_name: "dory", display_name: "Dory", email: null, avatar_color: null, created_at: "", deactivated_at: null },
  { id: "j", first_name: "jenny", display_name: "Jenny", email: null, avatar_color: null, created_at: "", deactivated_at: null },
];

describe("<AddExpenseForm />", () => {
  it("renders one option per member plus (you) suffix", () => {
    render(<AddExpenseForm members={members} currentMemberId="y" />);

    const paidBy = screen.getByLabelText("Paid by") as HTMLSelectElement;
    const options = Array.from(paidBy.options).map((o) => o.text);

    expect(options).toContain("Yueran (you)");
    expect(options).toContain("Dory");
    expect(options).toContain("Jenny");
    expect(paidBy.value).toBe("y");
  });

  it("lists all expense categories with emoji", () => {
    render(<AddExpenseForm members={members} currentMemberId="y" />);
    const cat = screen.getByLabelText("Category") as HTMLSelectElement;
    const labels = Array.from(cat.options).map((o) => o.text);
    expect(labels.some((l) => l.includes("Software"))).toBe(true);
    expect(labels.some((l) => l.includes("💻"))).toBe(true);
    expect(labels.some((l) => l.includes("Other"))).toBe(true);
  });

  it("defaults date to today (ISO YYYY-MM-DD)", () => {
    render(<AddExpenseForm members={members} currentMemberId="y" />);
    const date = screen.getByLabelText("Date") as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(date.value).toBe(today);
  });

  it("marks description and amount as required", () => {
    render(<AddExpenseForm members={members} currentMemberId="y" />);
    const desc = screen.getByLabelText("Description") as HTMLInputElement;
    const amt = screen.getByLabelText("Amount") as HTMLInputElement;
    expect(desc.required).toBe(true);
    expect(amt.required).toBe(true);
  });

  it("updates paid_by when a user picks another member", async () => {
    const user = userEvent.setup();
    render(<AddExpenseForm members={members} currentMemberId="y" />);
    const paidBy = screen.getByLabelText("Paid by") as HTMLSelectElement;
    await user.selectOptions(paidBy, "d");
    expect(paidBy.value).toBe("d");
  });

  it("reports the correct headcount in the split copy", () => {
    render(<AddExpenseForm members={members} currentMemberId="y" />);
    expect(
      screen.getByText(/across all 3 of you/i),
    ).toBeInTheDocument();
  });
});
