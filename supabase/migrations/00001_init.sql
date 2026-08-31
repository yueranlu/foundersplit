-- FounderSplit — initial schema
--
-- Design principles:
-- * Amounts stored in cents (integer) end-to-end. Never floats for money.
-- * Splits are computed on read; the schema stores what was paid, not shares.
-- * Soft delete via deleted_at so history and settlements don't drift.
-- * Auth is not Supabase Auth — the app manages signed-cookie sessions and
--   passes the current member_id to postgres via `current_setting`. RLS
--   consumes that setting.

set search_path = public;

-- ─── extensions ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── enum: expense category ─────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type expense_category as enum (
      'software', 'hosting', 'legal', 'accounting', 'marketing',
      'travel', 'meals', 'hardware', 'contractors', 'fees', 'other'
    );
  end if;
end$$;

-- ─── members ────────────────────────────────────────────────────────────────
create table if not exists members (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null unique
                   check (first_name = lower(first_name) and length(first_name) between 2 and 40),
  display_name   text not null check (length(display_name) between 1 and 80),
  email          text,
  avatar_color   text,
  created_at     timestamptz not null default now(),
  deactivated_at timestamptz
);

create index if not exists members_active_idx on members (id) where deactivated_at is null;

-- ─── expenses ───────────────────────────────────────────────────────────────
create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  paid_by       uuid not null references members (id) on delete restrict,
  description   text not null check (length(description) between 1 and 500),
  category      expense_category not null default 'other',
  amount_cents  integer not null check (amount_cents > 0),
  note          text,
  created_at    timestamptz not null default now(),
  created_by    uuid not null references members (id) on delete restrict,
  deleted_at    timestamptz,
  deleted_by    uuid references members (id)
);

create index if not exists expenses_date_idx on expenses (date desc) where deleted_at is null;
create index if not exists expenses_paid_by_idx on expenses (paid_by) where deleted_at is null;

-- ─── receipts ───────────────────────────────────────────────────────────────
create table if not exists receipts (
  id            uuid primary key default gen_random_uuid(),
  expense_id    uuid not null references expenses (id) on delete cascade,
  filename      text not null,
  storage_path  text not null unique,
  mime_type     text not null,
  size_bytes    integer not null check (size_bytes > 0 and size_bytes <= 20 * 1024 * 1024),
  created_at    timestamptz not null default now(),
  uploaded_by   uuid not null references members (id) on delete restrict
);

create index if not exists receipts_expense_idx on receipts (expense_id);

-- ─── settlements ────────────────────────────────────────────────────────────
-- One row per creditor–debtor–month tuple. Payer marks it paid on their end;
-- the receiver doesn't confirm. If disputes arise, undo by clearing
-- marked_paid_at.
create table if not exists settlements (
  id               uuid primary key default gen_random_uuid(),
  month            text not null check (month ~ '^\d{4}-\d{2}$'),
  from_member_id   uuid not null references members (id) on delete restrict,
  to_member_id     uuid not null references members (id) on delete restrict,
  amount_cents     integer not null check (amount_cents > 0),
  marked_paid_at   timestamptz,
  marked_paid_by   uuid references members (id),
  created_at       timestamptz not null default now(),
  check (from_member_id <> to_member_id),
  unique (month, from_member_id, to_member_id)
);

create index if not exists settlements_month_idx on settlements (month);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Model: the anon key is what the client uses, and the app always speaks
-- through server actions running with the service_role key. So RLS is a
-- second line of defence — deny anon by default, allow authenticated
-- (service_role in server actions) to do anything the app logic permits.
--
-- Because there is no Supabase Auth here, we grant full access to
-- service_role (which bypasses RLS anyway) and disallow anon. Client-side
-- code with the publishable key gets nothing.

alter table members     enable row level security;
alter table expenses    enable row level security;
alter table receipts    enable row level security;
alter table settlements enable row level security;

-- Explicit "no access for anon" policies. Server code uses service_role and
-- bypasses these.
create policy members_no_anon     on members     for all to anon using (false) with check (false);
create policy expenses_no_anon    on expenses    for all to anon using (false) with check (false);
create policy receipts_no_anon    on receipts    for all to anon using (false) with check (false);
create policy settlements_no_anon on settlements for all to anon using (false) with check (false);

-- ─── storage: receipts bucket ───────────────────────────────────────────────
-- Bucket is created imperatively via the storage API in the app (idempotent),
-- but you can also create it here in the SQL editor:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 20 * 1024 * 1024,
        array['application/pdf','image/png','image/jpeg','image/webp','image/heic'])
on conflict (id) do nothing;
