import Link from "next/link";
import { HandCoins } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { getBalanceOverview, listActivity } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { AddExpenseForm } from "./add-expense-form";
import { ActivityRow } from "./activity-row";
import { EmptyBalances } from "./empty-balances";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const me = await requireMember();
  const [overview, activity] = await Promise.all([
    getBalanceOverview(me.id),
    listActivity({ limit: 5 }),
  ]);

  return (
    <div className="space-y-10">
      {/* Hero: net balance */}
      <BalanceHero
        netCents={overview.netCents}
        totalOwedCents={overview.totalOwedToYouCents}
        totalYouOweCents={overview.totalYouOweCents}
        hasActivity={overview.hasActivity}
      />

      {/* Per-person breakdown */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Between you and each cofounder
          </h2>
          <Link
            href="/settle"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            History →
          </Link>
        </div>

        {overview.pairs.length === 0 || !overview.hasActivity ? (
          <EmptyBalances />
        ) : (
          <ul className="space-y-2">
            {overview.pairs.map((pair) => (
              <li key={pair.otherMember.id}>
                <PairRow
                  meId={me.id}
                  otherName={pair.otherMember.display_name}
                  color={pair.otherMember.avatar_color}
                  otherId={pair.otherMember.id}
                  netCents={pair.netCentsTheyOweYou}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add expense */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Add an expense</h2>
          <p className="text-sm text-muted-foreground">
            Splits evenly across all {overview.headcount} of you.
          </p>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="p-5 sm:p-6">
            <AddExpenseForm
              members={overview.members}
              currentMemberId={me.id}
            />
          </CardContent>
        </Card>
      </section>

      {/* Recent activity teaser */}
      {activity.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent activity
            </h2>
            <Link
              href="/expenses"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              See all →
            </Link>
          </div>
          <ul className="space-y-2">
            {activity.map((item, i) => (
              <ActivityRow
                key={i}
                item={item}
                members={overview.members}
                meId={me.id}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BalanceHero({
  netCents,
  totalOwedCents,
  totalYouOweCents,
  hasActivity,
}: {
  netCents: number;
  totalOwedCents: number;
  totalYouOweCents: number;
  hasActivity: boolean;
}) {
  if (!hasActivity) {
    return (
      <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-rose-500/10">
        <CardContent className="p-8 text-center">
          <div className="mb-2 text-4xl">👋</div>
          <div className="text-2xl font-semibold tracking-tight">
            Welcome to FounderSplit
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Add the first expense to get things rolling.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (netCents === 0) {
    return (
      <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-emerald-500/10">
        <CardContent className="p-8 text-center">
          <div className="mb-2 text-4xl">🎉</div>
          <div className="text-2xl font-semibold tracking-tight">
            You&apos;re all settled
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Nice work. Nothing owed either way.
          </div>
        </CardContent>
      </Card>
    );
  }

  const positive = netCents > 0;
  const abs = Math.abs(netCents);

  return (
    <Card
      className={`overflow-hidden rounded-2xl border-0 ${
        positive
          ? "bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-emerald-500/10"
          : "bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50 dark:from-rose-500/20 dark:via-orange-500/10 dark:to-amber-500/10"
      }`}
    >
      <CardContent className="p-8">
        <div className="text-sm font-medium text-muted-foreground">
          {positive ? "You're owed" : "You owe"}
        </div>
        <div className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
          {formatCents(abs)}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {positive ? (
              <>
                Owed to you: {formatCents(totalOwedCents)}
                {totalYouOweCents > 0 && (
                  <> · You owe: {formatCents(totalYouOweCents)}</>
                )}
              </>
            ) : (
              <>
                You owe: {formatCents(totalYouOweCents)}
                {totalOwedCents > 0 && (
                  <> · Owed to you: {formatCents(totalOwedCents)}</>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PairRow({
  meId,
  otherName,
  otherId,
  color,
  netCents,
}: {
  meId: string;
  otherName: string;
  otherId: string;
  color: string | null;
  netCents: number;
}) {
  const initial = otherName.charAt(0).toUpperCase();
  const settled = netCents === 0;
  const theyOwe = netCents > 0;

  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ background: color ?? "#94a3b8" }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{otherName}</div>
          <div
            className={`text-sm tabular-nums ${
              settled
                ? "text-muted-foreground"
                : theyOwe
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {settled
              ? "settled"
              : theyOwe
              ? `owes you ${formatCents(netCents)}`
              : `you owe ${formatCents(-netCents)}`}
          </div>
        </div>
        {!settled && (
          <Link
            href={
              theyOwe
                ? `/settle/${otherId}?from=${otherId}&to=${meId}`
                : `/settle/${otherId}?from=${meId}&to=${otherId}`
            }
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            <HandCoins className="h-4 w-4" />
            Settle
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
