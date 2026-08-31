import { CATEGORY_LABELS, type Expense, type Member } from "@/lib/types";
import { formatCents, splitEvenly } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";

export function RecentList({
  expenses,
  members,
  currentMemberId,
}: {
  expenses: Expense[];
  members: Member[];
  currentMemberId: string;
}) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nothing yet this month. Log the first expense above.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {expenses.map((exp) => {
        const paidBy = members.find((m) => m.id === exp.paid_by);
        const perPerson = splitEvenly(exp.amount_cents, members.length)[0];
        return (
          <Card key={exp.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{exp.description}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  <span>{CATEGORY_LABELS[exp.category]}</span>
                  <span>·</span>
                  <span>
                    {paidBy
                      ? paidBy.id === currentMemberId
                        ? "You paid"
                        : `${paidBy.display_name} paid`
                      : "?"}
                  </span>
                  <span>·</span>
                  <span>{exp.date}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums">
                  {formatCents(exp.amount_cents)}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatCents(perPerson)} each
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </ul>
  );
}
