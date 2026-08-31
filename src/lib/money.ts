/**
 * Money helpers. All amounts are stored as cents (integer). Never do decimal
 * arithmetic on money — floats will bite you the second an expense splits
 * unevenly.
 */

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString()}.${remainder.toString().padStart(2, "0")}`;
}

export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const wholeCents = Number(whole) * 100;
  const fractionCents = Number((fraction + "00").slice(0, 2));
  return wholeCents + (whole.startsWith("-") ? -fractionCents : fractionCents);
}

/**
 * Split a total evenly across N people, distributing the leftover pennies
 * one-per-person until they're gone. Guarantees the shares sum back to the
 * total exactly — no rounding drift.
 */
export function splitEvenly(totalCents: number, headcount: number): number[] {
  if (headcount <= 0) return [];
  const base = Math.floor(totalCents / headcount);
  const remainder = totalCents - base * headcount;
  return Array.from({ length: headcount }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
}
