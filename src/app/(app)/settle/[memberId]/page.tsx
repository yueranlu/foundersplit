import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { getBalanceOverview, getMemberById } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { createPayment } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentMethod } from "@/lib/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-10 w-full items-center rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-xs",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export default async function SettleUpPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const me = await requireMember();
  const { memberId } = await params;
  const other = await getMemberById(memberId);
  if (!other || other.id === me.id) redirect("/");

  const overview = await getBalanceOverview(me.id);
  const pair = overview.pairs.find((p) => p.otherMember.id === other.id);
  const net = pair?.netCentsTheyOweYou ?? 0;

  // Determine direction: if net > 0, they owe you (they → me). If < 0, you owe.
  const theyOweYou = net > 0;
  const abs = Math.abs(net);

  // From/To for the payment record: the one who owes is the payer.
  const from_member_id = theyOweYou ? other.id : me.id;
  const to_member_id = theyOweYou ? me.id : other.id;
  const fromName = theyOweYou ? other.display_name : "You";
  const toName = theyOweYou ? "you" : other.display_name;

  const methods: PaymentMethod[] = ["e_transfer", "venmo", "cash", "other"];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settle up</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {net === 0
            ? `You and ${other.display_name} are already settled.`
            : theyOweYou
            ? `${other.display_name} owes you ${formatCents(abs)}.`
            : `You owe ${other.display_name} ${formatCents(abs)}.`}
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <form action={createPayment} className="space-y-5">
            <input type="hidden" name="from_member_id" value={from_member_id} />
            <input type="hidden" name="to_member_id" value={to_member_id} />

            <div className="rounded-xl bg-muted/60 p-4 text-sm">
              <div className="text-muted-foreground">Recording payment</div>
              <div className="mt-1 font-medium">
                {fromName} → {toName}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                defaultValue={net !== 0 ? (abs / 100).toFixed(2) : ""}
                placeholder="0.00"
                className="rounded-xl text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">How</Label>
              <select
                id="method"
                name="method"
                defaultValue="e_transfer"
                className={selectClass}
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                name="note"
                placeholder="Settling August"
                rows={2}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl"
              size="lg"
              disabled={net === 0}
            >
              Record payment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
