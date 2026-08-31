import { CATEGORY_LABELS, type Expense } from "@/lib/types";
import { formatCents, splitEvenly } from "@/lib/money";
import {
  DEMO_CURRENT_MEMBER_ID,
  DEMO_EXPENSES,
  DEMO_MEMBERS,
} from "@/lib/demo";
import { Card, CardContent } from "@/components/ui/card";

function groupByMonth(expenses: Expense[]) {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_LABELS[Number(m) - 1]} ${y}`;
}

export default function ActivityPage() {
  const meId = DEMO_CURRENT_MEMBER_ID;
  const headcount = DEMO_MEMBERS.length;
  const grouped = groupByMonth(DEMO_EXPENSES);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every expense, and what it cost each of you.
          </p>
        </div>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          Export CSV
        </button>
      </div>

      {grouped.map(([month, list]) => {
        const total = list.reduce((a, e) => a + e.amount_cents, 0);
        const yourShare = splitEvenly(total, headcount)[0];
        return (
          <section key={month} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {monthLabel(month)}{" "}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({list.length} {list.length === 1 ? "expense" : "expenses"})
                </span>
              </h2>
              <div className="text-right">
                <div className="font-semibold tabular-nums">
                  {formatCents(total)}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatCents(yourShare)} your share
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {list.map((exp) => {
                const paidBy = DEMO_MEMBERS.find((m) => m.id === exp.paid_by);
                const per = splitEvenly(exp.amount_cents, headcount)[0];
                return (
                  <Card key={exp.id}>
                    <CardContent className="space-y-2 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{exp.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {CATEGORY_LABELS[exp.category]}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold tabular-nums">
                            {formatCents(exp.amount_cents)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        <span>
                          {paidBy?.id === meId
                            ? "You paid"
                            : `${paidBy?.display_name} paid`}
                        </span>
                        <span>·</span>
                        <span>{exp.date}</span>
                        <span>·</span>
                        <span>
                          → {formatCents(per)} each × {headcount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
