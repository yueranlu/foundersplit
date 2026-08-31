"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Member } from "@/lib/types";

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
  const [splitMode, setSplitMode] = useState<"even" | "custom">("even");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const activeCount = Math.max(1, members.length - excluded.size);

  return (
    <form className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today()} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paid_by">Paid by</Label>
          <Select value={paidBy} onValueChange={(v) => v && setPaidBy(v)}>
            <SelectTrigger id="paid_by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.display_name}
                  {m.id === currentMemberId ? " (you)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Incorporation filing fee"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((k) => (
                <SelectItem key={k} value={k}>
                  {CATEGORY_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Anything the team should know about this expense"
          rows={2}
        />
      </div>

      <div className="rounded-lg border border-dashed p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">Split</div>
            <div className="text-xs text-muted-foreground">
              {splitMode === "even"
                ? `Evenly across ${activeCount} of ${members.length}`
                : "Custom — pick who this is for"}
            </div>
          </div>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setSplitMode("even")}
              className={`rounded px-2 py-1 ${
                splitMode === "even"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Even
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("custom")}
              className={`rounded px-2 py-1 ${
                splitMode === "custom"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Choose
            </button>
          </div>
        </div>

        {splitMode === "custom" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {members.map((m) => {
              const on = !excluded.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setExcluded((prev) => {
                      const next = new Set(prev);
                      if (on) next.add(m.id);
                      else next.delete(m.id);
                      return next;
                    })
                  }
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    on
                      ? "border-foreground/30 bg-muted"
                      : "border-dashed text-muted-foreground"
                  }`}
                >
                  {m.display_name}
                  {m.id === currentMemberId ? " (you)" : ""}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-dashed p-4">
        <Label className="mb-2 block">Receipts</Label>
        <Button variant="outline" type="button" className="gap-2">
          <Paperclip className="h-4 w-4" />
          Attach PDF or photo
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          PDF, PNG, JPG, WebP or HEIC. Up to 20 MB each.
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg">
        Add expense
      </Button>
    </form>
  );
}
