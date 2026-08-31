import { Nav } from "./nav";
import { requireMember } from "@/lib/auth";
import { getBalanceOverview } from "@/lib/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireMember();
  const overview = await getBalanceOverview(me.id);

  return (
    <>
      <Nav displayName={me.display_name} owedCents={overview.netCents} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
    </>
  );
}
