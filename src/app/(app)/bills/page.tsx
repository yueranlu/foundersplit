import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getMonthSummary } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysUntilEndOfMonth(): number {
  const now = new Date();
  const eom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );
  return Math.max(0, Math.ceil((eom.getTime() - now.getTime()) / 86400000));
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[Number(m) - 1]} ${y}`;
}

export default async function BillsPage() {
  const me = await requireMember();
  const monthKey = currentMonthKey();
  const summary = await getMonthSummary(monthKey, me.id);
  const daysDue = daysUntilEndOfMonth();

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
            <CardTitle className="text-2xl">{monthLabel(monthKey)}</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              Due end of month · still open
            </div>
          </div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
            Due in {daysDue}d
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Team spent"
              value={formatCents(summary.totalCents)}
              sub={`${summary.expenses.length} expenses`}
            />
            <Stat
              label="Your share"
              value={formatCents(summary.yourShareCents)}
              sub={`split ${summary.headcount} ways`}
            />
            <Stat
              label="You fronted"
              value={formatCents(summary.youFrontedCents)}
            />
            <Stat
              label="You're owed"
              value={formatCents(summary.youreOwedCents)}
              highlight
            />
          </dl>

          {summary.waitingOn.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Waiting on</h3>
              <ul className="mt-2 divide-y">
                {summary.waitingOn.map((row) => (
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
          )}

          <Link
            href={`/expenses?month=${monthKey}`}
            className="inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            See the {summary.expenses.length}{" "}
            {summary.expenses.length === 1 ? "expense" : "expenses"} behind this →
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
