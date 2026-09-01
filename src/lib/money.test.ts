import { describe, expect, it } from "vitest";
import { formatCents, parseDollarsToCents, splitEvenly } from "./money";

describe("formatCents", () => {
  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats whole dollars", () => {
    expect(formatCents(100)).toBe("$1.00");
    expect(formatCents(10000)).toBe("$100.00");
  });

  it("formats sub-dollar amounts", () => {
    expect(formatCents(1)).toBe("$0.01");
    expect(formatCents(99)).toBe("$0.99");
    expect(formatCents(50)).toBe("$0.50");
  });

  it("pads single-digit cents with a leading zero", () => {
    expect(formatCents(105)).toBe("$1.05");
    expect(formatCents(1005)).toBe("$10.05");
  });

  it("adds thousands separators", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(100000000)).toBe("$1,000,000.00");
  });

  it("handles negatives", () => {
    expect(formatCents(-1)).toBe("-$0.01");
    expect(formatCents(-1234)).toBe("-$12.34");
    expect(formatCents(-100000)).toBe("-$1,000.00");
  });

  it("formats the domain-expense case", () => {
    // The very first real expense on the app.
    expect(formatCents(5058)).toBe("$50.58");
  });
});

describe("parseDollarsToCents", () => {
  it("parses whole dollars", () => {
    expect(parseDollarsToCents("10")).toBe(1000);
    expect(parseDollarsToCents("0")).toBe(0);
  });

  it("parses decimal cents", () => {
    expect(parseDollarsToCents("10.5")).toBe(1050);
    expect(parseDollarsToCents("10.50")).toBe(1050);
    expect(parseDollarsToCents("10.55")).toBe(1055);
    expect(parseDollarsToCents("0.99")).toBe(99);
    expect(parseDollarsToCents("0.01")).toBe(1);
  });

  it("strips a leading dollar sign", () => {
    expect(parseDollarsToCents("$10.55")).toBe(1055);
    expect(parseDollarsToCents("$0.01")).toBe(1);
  });

  it("strips commas and whitespace", () => {
    expect(parseDollarsToCents("1,234.56")).toBe(123456);
    expect(parseDollarsToCents(" 10.50 ")).toBe(1050);
    expect(parseDollarsToCents("$1,000.00")).toBe(100000);
  });

  it("rejects empty and whitespace-only input", () => {
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents("   ")).toBeNull();
  });

  it("rejects garbage", () => {
    expect(parseDollarsToCents("abc")).toBeNull();
    expect(parseDollarsToCents("10.5.5")).toBeNull();
    expect(parseDollarsToCents("ten dollars")).toBeNull();
  });

  it("is permissive about repeated formatting characters", () => {
    // Not a hard rule, but the current implementation strips all $, commas,
    // and whitespace before validating. Documenting the behavior so any
    // future tightening flags this test.
    expect(parseDollarsToCents("$$10")).toBe(1000);
    expect(parseDollarsToCents(",1,0,")).toBe(1000);
  });

  it("rejects too many decimal places", () => {
    expect(parseDollarsToCents("10.555")).toBeNull();
    expect(parseDollarsToCents("0.001")).toBeNull();
  });

  it("round-trips with formatCents", () => {
    const cases = ["0.01", "1.00", "12.34", "1234.56", "0.99"];
    for (const s of cases) {
      const cents = parseDollarsToCents(s);
      expect(cents).not.toBeNull();
      const formatted = formatCents(cents!);
      const withDollar = `$${s.includes(",") ? s.replace(/,/g, "") : s}`;
      // formatCents adds thousand separators; strip them for the compare.
      expect(formatted.replace(/,/g, "")).toBe(withDollar);
    }
  });

  it("parses the domain-expense case", () => {
    expect(parseDollarsToCents("50.58")).toBe(5058);
  });
});

describe("splitEvenly", () => {
  it("returns an empty array for zero headcount", () => {
    expect(splitEvenly(1000, 0)).toEqual([]);
    expect(splitEvenly(0, 0)).toEqual([]);
  });

  it("splits evenly when total divides cleanly", () => {
    expect(splitEvenly(1000, 4)).toEqual([250, 250, 250, 250]);
    expect(splitEvenly(0, 4)).toEqual([0, 0, 0, 0]);
    expect(splitEvenly(500, 5)).toEqual([100, 100, 100, 100, 100]);
  });

  it("distributes leftover pennies to the first N indices", () => {
    // 1001 / 4 = 250.25. Distribute 1 penny to the first index.
    expect(splitEvenly(1001, 4)).toEqual([251, 250, 250, 250]);
    // 1003 / 4 = 250.75. Distribute 3 pennies to the first three indices.
    expect(splitEvenly(1003, 4)).toEqual([251, 251, 251, 250]);
    // 7 / 3 = 2.33. Distribute 1 penny to index 0.
    expect(splitEvenly(7, 3)).toEqual([3, 2, 2]);
  });

  it("splits 5058 five ways (real domain expense before Siva left)", () => {
    // $50.58 / 5 = $10.116. Base 1011, remainder 3.
    // Wait: 5058 / 5 = 1011.6. Base 1011, remainder 3. First 3 get +1.
    // Actually: 5058 = 5 * 1011 + 3, so [1012, 1012, 1012, 1011, 1011].
    expect(splitEvenly(5058, 5)).toEqual([1012, 1012, 1012, 1011, 1011]);
  });

  it("splits 5058 four ways (real domain expense after Siva left)", () => {
    // 5058 / 4 = 1264.5. Base 1264, remainder 2. First 2 get +1.
    expect(splitEvenly(5058, 4)).toEqual([1265, 1265, 1264, 1264]);
  });

  it("guarantees the sum equals the input, always", () => {
    const cases: [number, number][] = [
      [0, 4],
      [1, 4],
      [1, 100],
      [999, 7],
      [12345, 11],
      [5058, 5],
      [5058, 4],
      [1_000_000, 13],
    ];
    for (const [total, n] of cases) {
      const parts = splitEvenly(total, n);
      const sum = parts.reduce((a, b) => a + b, 0);
      expect(sum).toBe(total);
    }
  });

  it("differs at most by one cent across all shares", () => {
    // Property: max - min ≤ 1 for any valid input.
    const cases: [number, number][] = [
      [1, 4],
      [7, 3],
      [999, 7],
      [12345, 11],
      [1_000_000, 13],
    ];
    for (const [total, n] of cases) {
      const parts = splitEvenly(total, n);
      const min = Math.min(...parts);
      const max = Math.max(...parts);
      expect(max - min).toBeLessThanOrEqual(1);
    }
  });

  it("handles single-person split (headcount 1)", () => {
    expect(splitEvenly(1234, 1)).toEqual([1234]);
    expect(splitEvenly(0, 1)).toEqual([0]);
  });
});
