"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Member,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { createExpense } from "./actions";

const selectClass = cn(
  "flex h-10 w-full items-center rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-xs",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

const today = () => new Date().toISOString().slice(0, 10);

export function AddExpenseForm({
  members,
  currentMemberId,
}: {
  members: Member[];
  currentMemberId: string;
}) {
  const [paidBy, setPaidBy] = useState<string>(currentMemberId);
  const [category, setCategory] = useState<string>("other");

  return (
    <form action={createExpense} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={today()}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paid_by">Paid by</Label>
          <select
            id="paid_by"
            name="paid_by"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className={selectClass}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
                {m.id === currentMemberId ? " (you)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Incorporation filing fee"
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            {CATEGORY_ORDER.map((k) => (
              <option key={k} value={k}>
                {CATEGORY_EMOJI[k]}  {CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="rounded-xl"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Anything the team should know"
          rows={2}
          className="rounded-xl"
        />
      </div>

      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
        <div className="text-sm">
          <span className="font-medium">Splits evenly</span>{" "}
          <span className="text-muted-foreground">
            across all {members.length} of you. Custom splits coming soon.
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
        <Label className="mb-2 block">Receipts</Label>
        <Button
          variant="outline"
          type="button"
          className="gap-2 rounded-lg"
          disabled
        >
          <Paperclip className="h-4 w-4" />
          Attach PDF or photo
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Receipt uploads coming soon.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl"
        size="lg"
      >
        Add expense
      </Button>
    </form>
  );
}
