import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AddExpenseForm } from "./add-expense-form";
import { RecentList } from "./recent-list";
import { requireMember } from "@/lib/auth";
import { getMonthSummary, listMembers } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";

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

export default async function HomePage() {
  const me = await requireMember();
  const monthKey = currentMonthKey();
  const [members, summary] = await Promise.all([
    listMembers(),
    getMonthSummary(monthKey, me.id),
  ]);
  const daysDue = daysUntilEndOfMonth();

  return (
    <div className="space-y-8">
      <Link href="/bills" className="block group">
        <Card className="transition-shadow group-hover:shadow-md">
          <CardContent className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {monthLabel(monthKey)}
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                {summary.youreOwedCents > 0
                  ? `You're owed ${formatCents(summary.youreOwedCents)}`
                  : summary.youreOwedCents < 0
                  ? `You owe ${formatCents(-summary.youreOwedCents)}`
                  : "You're settled"}
              </div>
              <div className="text-sm text-muted-foreground">
                Due in {daysDue} {daysDue === 1 ? "day" : "days"} ·{" "}
                {summary.expenses.length}{" "}
                {summary.expenses.length === 1 ? "expense" : "expenses"} so far
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Add an expense
          </h2>
          <p className="text-sm text-muted-foreground">
            Splits evenly across all {summary.headcount} of you, unless you say
            otherwise.
          </p>
        </div>
        <AddExpenseForm members={members} currentMemberId={me.id} />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">This month</h2>
          <Link
            href="/expenses"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            See all →
          </Link>
        </div>
        <RecentList
          expenses={summary.expenses}
          members={members}
          currentMemberId={me.id}
        />
      </section>
    </div>
  );
}
