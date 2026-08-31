import { CATEGORY_EMOJI, CATEGORY_LABELS, type Member } from "@/lib/types";
import { formatCents, splitEvenly } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { ActivityItem } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";

export function ActivityRow({
  item,
  members,
  meId,
}: {
  item: ActivityItem;
  members: Member[];
  meId: string;
}) {
  if (item.kind === "expense") {
    const exp = item.expense;
    const paidBy = members.find((m) => m.id === exp.paid_by);
    const perPerson = splitEvenly(exp.amount_cents, members.length)[0];
    const isMe = paidBy?.id === meId;

    return (
      <Card className="rounded-xl">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-lg">
            {CATEGORY_EMOJI[exp.category]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{exp.description}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {isMe ? "You" : paidBy?.display_name ?? "?"} paid ·{" "}
              {CATEGORY_LABELS[exp.category]} · {exp.date}
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
  }

  // payment
  const p = item.payment;
  const from = members.find((m) => m.id === p.from_member_id);
  const to = members.find((m) => m.id === p.to_member_id);
  const isMeSender = from?.id === meId;
  const isMeReceiver = to?.id === meId;
  const fromName = isMeSender ? "You" : from?.display_name ?? "?";
  const toName = isMeReceiver ? "you" : to?.display_name ?? "?";

  return (
    <Card className="rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-lg dark:bg-emerald-500/20">
          💸
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            {fromName} paid {toName}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {PAYMENT_METHOD_LABELS[p.method]} ·{" "}
            {new Date(p.made_at).toISOString().slice(0, 10)}
            {p.note ? ` · ${p.note}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatCents(p.amount_cents)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
