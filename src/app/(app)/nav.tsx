"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/money";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "./actions";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/expenses", label: "Activity" },
  { href: "/team", label: "Team" },
] as const;

export function Nav({
  displayName,
  owedCents,
}: {
  displayName: string;
  owedCents: number;
}) {
  const pathname = usePathname();
  const initial = displayName.charAt(0).toUpperCase();
  const owedLabel =
    owedCents > 0
      ? `Owed ${formatCents(owedCents)}`
      : owedCents < 0
      ? `Owes ${formatCents(-owedCents)}`
      : "Settled";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background text-xs">
            FS
          </span>
          <span className="hidden sm:inline">FounderSplit</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden text-sm font-medium text-muted-foreground sm:block">
          {owedLabel}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-2 rounded-full px-2 text-sm font-medium hover:bg-muted"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-medium">
              {initial}
            </span>
            <span className="hidden md:inline">{displayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href="/team" className="w-full">
                Team settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
