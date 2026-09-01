# FounderSplit

A cofounder expense splitter. Log shared startup costs, watch balances update in real time, settle up when it makes sense. Same idea as Splitwise, scoped to a small trusted team.

Live at [foundersplit.vercel.app](https://foundersplit.vercel.app).

## What it does

Five cofounders share expenses (SaaS, hosting, legal, domain fees). Each expense splits evenly across the team. Balances between every pair of people accumulate over time. When someone pays another back, a payment is recorded and the balance moves closer to zero.

There are four screens:

* **Home**. A big card showing the net across all cofounders (how much you are owed, or how much you owe). Below it, one row per cofounder with the exact amount between the two of you and a Settle button when there is money to move.
* **Activity**. Every expense and every payment in one chronological feed, grouped by day.
* **Team**. The list of cofounders, their sign in name, and a form to add a new one.
* **Settle up**. Reached from a Settle button on Home. Records who paid whom, how much, by what method (e-Transfer, Venmo, cash, other).

## The logic

### Money in cents, never floats

Every amount is stored as an integer number of cents. Formatting to dollars happens at the edges (input parsing, display). This kills the whole class of bugs where 0.1 + 0.2 turns out to not be 0.3.

### Penny safe even splits

Splitting $50.58 across 4 people is not $12.645 each. The `splitEvenly` helper distributes the total as `[$12.65, $12.65, $12.64, $12.64]`, giving the extra pennies to the first N indices. The sum always matches the total exactly. No rounding drift.

```ts
splitEvenly(5058, 4)  // [1265, 1265, 1264, 1264]
splitEvenly(5058, 5)  // [1012, 1012, 1012, 1011, 1011]
```

### Balances as a pairwise ledger

Instead of storing per-person shares in the database, the app computes them on read. The `getBalanceOverview` function walks every expense and every payment, and builds a ledger of net balance between each pair of members.

For each expense, everyone except the payer owes their share to the payer. For each payment, the payer reduces their debt to the receiver. What each cofounder owes you is a single number at any point in time.

```
net_that_B_owes_A =
    (B's shares on expenses A paid for)
  - (A's shares on expenses B paid for)
  - (payments B made to A)
  + (payments A made to B)
```

Positive means B owes A. Negative means A owes B. Zero means settled.

This design has one useful consequence: adding or removing a cofounder retroactively re-splits every past expense with the new headcount. If you started at 5 people and Siva leaves, the same $50.58 domain expense now splits four ways instead of five, and the running balances shift accordingly. History stays intact; splits reflect the current team.

The tradeoff: past balances change when the team changes. If you would rather freeze historical splits at their original headcount, the alternative is a per-expense shares table.

### Auth without Supabase Auth

Login is intentionally minimal. Type your first name (lowercase), press Continue. Server side, the app looks up the member with that first name, signs a cookie with the member id, sets an HTTP-only cookie, redirects to Home. Every protected route reads the cookie and looks up the member.

There is no password. This is a private tool for five people who know the URL. If you need drive-by protection, set a `TEAM_PASSCODE` env var and the login form will require it in addition to the first name.

### Row Level Security

Every table has RLS enabled with a single `deny anon` policy. Client side code with the publishable key gets nothing. All reads and writes flow through Next.js server actions running with the `service_role` key, which bypasses RLS entirely and lets application code decide who sees what.

This is a deliberately simple model. It works because the app is a small internal tool where every legitimate access happens server side. A public product would want per-user JWTs and proper policies.

## Stack

* **Next.js 16** on the App Router, with server actions for mutations.
* **TypeScript** everywhere.
* **Tailwind CSS 4** for styling.
* **shadcn/ui** components (Card, Button, Input, Label, Textarea, Dialog, DropdownMenu).
* **Supabase** for Postgres, Storage, and the publishable/secret key model.
* **Vercel** for hosting.
* **lucide-react** for icons.
* **lottie-react** ready to drop in for animations (currently the app uses CSS float animation for empty states).

## Data model

Four tables, all in the `public` schema.

**members**

Cofounders. First name is the unique login credential. Soft delete via `deactivated_at`.

**expenses**

The shared expenses themselves. Amount in cents, category from an enum, paid by a member, soft delete via `deleted_at`. Notes and receipts optional.

**payments**

Records that one member paid another. Amount, method, optional note. This is what shifts balances back toward zero.

**receipts**

Files attached to expenses, tracked in a private Supabase Storage bucket. PDF, PNG, JPG, WebP, or HEIC. Up to 20 MB each. (Upload UI is present but disabled until the storage plumbing lands.)

**settlements**

A legacy monthly settlement table. Retained for backwards compatibility with an older version of the schema. The current UI ignores it in favor of the payments table.

## Local development

```bash
git clone https://github.com/yueranlu/foundersplit.git
cd foundersplit
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

You will also need the `SUPABASE_SERVICE_ROLE_KEY` for server side reads and writes, and a `SESSION_SECRET` (any long random string will do). Both go in `.env.local`.

Optional: `TEAM_PASSCODE` to require a shared secret alongside the first name login.

## Deployment

Deployed on Vercel. Every push to `main` auto deploys to production at `foundersplit.vercel.app`. Every push to a branch gets its own preview URL.

Env vars live in Vercel Project Settings under Environment Variables, with `Production`, `Preview`, and `Development` scopes.

## Migrations

SQL files live in `supabase/migrations/`. To apply them to a fresh Supabase project, paste each file into the SQL Editor and run. They are idempotent (`if not exists`, `on conflict do nothing`) so re-running is safe.

* `00001_init.sql`. Extensions, category enum, four tables with constraints and indexes, RLS deny anon policies, receipts storage bucket.
* `00002_seed_members.sql`. Inserts the initial five cofounders.
* `00003_payments.sql`. Adds the payments table and its RLS policy.

## Structure

```
src/
  app/
    (app)/            authenticated routes
      page.tsx        home dashboard
      layout.tsx      shared nav
      nav.tsx
      actions.ts      server actions: createExpense, createPayment, ...
      add-expense-form.tsx
      activity-row.tsx
      empty-balances.tsx
      bills/          retired, redirects to /
      expenses/       activity feed
      settle/[memberId]/  settle up form
      team/           cofounder list + add form
    login/            passwordless login
    layout.tsx        root layout
    globals.css       theme + animations
  components/ui/      shadcn primitives
  lib/
    auth.ts           signed cookie sessions, requireMember()
    queries.ts        supabase reads + balance math
    money.ts          formatCents, parseDollarsToCents, splitEvenly
    types.ts          domain types + category emoji + payment methods
    supabase/
      admin.ts        service_role client (server only)
      client.ts       browser client (unused for now)
      server.ts       cookie based server client (unused for now)
  proxy.ts            route protection

supabase/migrations/  SQL migration files
```

## What is intentionally simple

* No dark mode toggle (uses system preference).
* No Supabase Auth. First name plus optional shared passcode is enough for a five person tool.
* No per-expense custom splits yet (everything divides evenly).
* No receipt upload yet (form has the slot, storage bucket exists).
* No CSV export yet.
* No push notifications.

Each of these is a small, well scoped addition when the need shows up.

## License

MIT.
