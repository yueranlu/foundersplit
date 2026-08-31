import Link from "next/link";
import {
  DEMO_CURRENT_MEMBER_ID,
  DEMO_EXPENSES,
  DEMO_MEMBERS,
} from "@/lib/demo";
import { formatCents, splitEvenly } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillsPage() {
  const meId = DEMO_CURRENT_MEMBER_ID;
  const headcount = DEMO_MEMBERS.length;

  const monthKey = "2026-08";
  const monthExpenses = DEMO_EXPENSES.filter((e) =>
    e.date.startsWith(monthKey),
  );

  const totalCents = monthExpenses.reduce((a, e) => a + e.amount_cents, 0);
  const yourShare = splitEvenly(totalCents, headcount)[0];
  const youFronted = monthExpenses
    .filter((e) => e.paid_by === meId)
    .reduce((a, e) => a + e.amount_cents, 0);
  const youreOwed = youFronted - yourShare;

  const waitingOn = monthExpenses
    .filter((e) => e.paid_by === meId)
    .flatMap((e) => {
      const per = splitEvenly(e.amount_cents, headcount);
      return DEMO_MEMBERS.filter((m) => m.id !== meId).map((m, idx) => ({
        member: m,
        cents: per[idx + (idx >= DEMO_MEMBERS.findIndex((x) => x.id === meId) ? 1 : 0)] ?? per[0],
      }));
    })
    .reduce(
      (acc, row) => {
        const cur = acc.get(row.member.id) ?? { member: row.member, cents: 0 };
        cur.cents += row.cents;
        acc.set(row.member.id, cur);
        return acc;
      },
      new Map<string, { member: (typeof DEMO_MEMBERS)[number]; cents: number }>(),
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Monthly bills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each month settles on its own. An unpaid month stays open until it&apos;s
          cleared.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">August 2026</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              Due 2026-08-31 · still open
            </div>
          </div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
            Due in 1 day
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Team spent"
              value={formatCents(totalCents)}
              sub={`${monthExpenses.length} expenses`}
            />
            <Stat
              label="Your share"
              value={formatCents(yourShare)}
              sub={`split ${headcount} ways`}
            />
            <Stat label="You fronted" value={formatCents(youFronted)} />
            <Stat
              label="You're owed"
              value={formatCents(youreOwed)}
              highlight
            />
          </dl>

          <div>
            <h3 className="text-sm font-semibold">Waiting on</h3>
            <ul className="mt-2 divide-y">
              {Array.from(waitingOn.values())
                .filter((r) => r.cents > 0)
                .sort((a, b) => b.cents - a.cents)
                .map((row) => (
                  <li
                    key={row.member.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: row.member.avatar_color ?? "#94a3b8",
                        }}
                      />
                      {row.member.display_name} owes you
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCents(row.cents)}
                    </span>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              They mark it paid on their side — you don&apos;t need to confirm.
            </p>
          </div>

          <Link
            href={`/expenses?month=${monthKey}`}
            className="inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            See the {monthExpenses.length}{" "}
            {monthExpenses.length === 1 ? "expense" : "expenses"} behind this →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 text-lg font-semibold tabular-nums ${
          highlight ? "text-emerald-600 dark:text-emerald-400" : ""
        }`}
      >
        {value}
      </dd>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
