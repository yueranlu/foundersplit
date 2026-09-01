// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyBalances } from "./empty-balances";

describe("<EmptyBalances />", () => {
  it("renders the empty-state headline and hint", () => {
    render(<EmptyBalances />);
    expect(screen.getByText(/Nothing owed yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add an expense below/i)).toBeInTheDocument();
  });

  it("shows the floating piggy emoji", () => {
    const { container } = render(<EmptyBalances />);
    expect(container.textContent).toContain("🐷");
    // The floating animation class is present so CSS can pick it up.
    expect(container.querySelector(".animate-float")).toBeTruthy();
  });
});
