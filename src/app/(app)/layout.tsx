import { Nav } from "./nav";
import { requireMember } from "@/lib/auth";
import { getMonthSummary } from "@/lib/queries";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireMember();
  const summary = await getMonthSummary(currentMonthKey(), me.id);

  return (
    <>
      <Nav displayName={me.display_name} owedCents={summary.youreOwedCents} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
    </>
  );
}
