/**
 * Splitwise-style empty state. Uses CSS float animation instead of Lottie for
 * the initial ship; Lottie can be swapped in per-view later.
 */
export function EmptyBalances() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed p-10 text-center">
      <div className="animate-float text-6xl leading-none">🐷</div>
      <div className="mt-4 font-medium">Nothing owed yet</div>
      <div className="text-sm text-muted-foreground">
        Add an expense below to start tracking.
      </div>
    </div>
  );
}
