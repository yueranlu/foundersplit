import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AddExpenseForm } from "./add-expense-form";
import { RecentList } from "./recent-list";
import {
  DEMO_CURRENT_MEMBER_ID,
  DEMO_EXPENSES,
  DEMO_MEMBERS,
} from "@/lib/demo";
import { formatCents, splitEvenly } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const meId = DEMO_CURRENT_MEMBER_ID;
  const headcount = DEMO_MEMBERS.length;

  const monthKey = "2026-08";
  const monthExpenses = DEMO_EXPENSES.filter((e) =>
    e.date.startsWith(monthKey),
  );

  const owedToMeCents = monthExpenses
    .filter((e) => e.paid_by === meId)
    .reduce((acc, e) => {
      const share = splitEvenly(e.amount_cents, headcount)[0];
      return acc + (e.amount_cents - share);
    }, 0);

  const dueDate = new Date(Date.UTC(2026, 7, 31));
  const daysUntilDue = Math.max(
    0,
    Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="space-y-8">
      <Link href="/bills" className="block group">
        <Card className="transition-shadow group-hover:shadow-md">
          <CardContent className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">August 2026</div>
              <div className="text-2xl font-semibold tracking-tight">
                You&apos;re owed {formatCents(owedToMeCents)}
              </div>
              <div className="text-sm text-muted-foreground">
                Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"} ·{" "}
                {monthExpenses.length}{" "}
                {monthExpenses.length === 1 ? "expense" : "expenses"} so far
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
            Splits evenly across all {headcount} of you, unless you say
            otherwise.
          </p>
        </div>
        <AddExpenseForm members={DEMO_MEMBERS} currentMemberId={meId} />
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
          expenses={monthExpenses}
          members={DEMO_MEMBERS}
          currentMemberId={meId}
        />
      </section>
    </div>
  );
}
