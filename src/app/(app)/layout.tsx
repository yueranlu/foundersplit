import { Nav } from "./nav";
import { DEMO_CURRENT_MEMBER_ID, DEMO_EXPENSES, DEMO_MEMBERS } from "@/lib/demo";
import { splitEvenly } from "@/lib/money";

/**
 * Authenticated app shell. Shell mode: reads member + balance from demo data.
 * Real wiring lands when Supabase schema is confirmed.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo balance calc — mirrors what the real bills query will do.
  const meId = DEMO_CURRENT_MEMBER_ID;
  const me = DEMO_MEMBERS.find((m) => m.id === meId)!;
  const headcount = DEMO_MEMBERS.length;

  const shares = DEMO_EXPENSES.flatMap((exp) => {
    const per = splitEvenly(exp.amount_cents, headcount);
    return DEMO_MEMBERS.map((mem, idx) => ({
      expense_id: exp.id,
      paid_by: exp.paid_by,
      member_id: mem.id,
      share: per[idx],
      total: exp.amount_cents,
    }));
  });

  const owedByOthers = shares
    .filter((s) => s.paid_by === meId && s.member_id !== meId)
    .reduce((acc, s) => acc + s.share, 0);
  const owedToOthers = shares
    .filter((s) => s.paid_by !== meId && s.member_id === meId)
    .reduce((acc, s) => acc + s.share, 0);
  const net = owedByOthers - owedToOthers;

  return (
    <>
      <Nav displayName={me.display_name} owedCents={net} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
    </>
  );
}
