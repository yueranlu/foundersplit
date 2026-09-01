import Link from "next/link";
import { Plus } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { listActivity, listMembers } from "@/lib/queries";
import { ActivityRow } from "../activity-row";
import { Card, CardContent } from "@/components/ui/card";

function groupByDay(items: Awaited<ReturnType<typeof listActivity>>) {
  const map = new Map<string, typeof items>();
  for (const it of items) {
    const day = new Date(it.at).toISOString().slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(it);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function friendlyDay(day: string): string {
  const now = new Date();
  const d = new Date(day);
  const diffDays = Math.round(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ActivityPage() {
  const me = await requireMember();
  const [members, activity] = await Promise.all([
    listMembers(),
    listActivity(),
  ]);
  const grouped = groupByDay(activity);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every expense and payment, most recent first.
          </p>
        </div>
      </div>

      {activity.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="grid place-items-center gap-4 py-12 text-center">
            <div className="animate-float text-6xl">🌱</div>
            <div className="font-medium">Nothing yet</div>
            <div className="text-sm text-muted-foreground">
              Once someone adds an expense or records a payment, it&apos;ll show here.
            </div>
            <div className="mt-2 flex gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add expense
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([day, items]) => (
          <section key={day} className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {friendlyDay(day)}
            </h2>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <ActivityRow
                  key={i}
                  item={item}
                  members={members}
                  meId={me.id}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
