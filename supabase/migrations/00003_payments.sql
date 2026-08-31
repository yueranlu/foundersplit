-- Splitwise-style: add payments so cofounders can record settling up.
-- Every payment shifts the ongoing balance between two people.

set search_path = public;

create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  from_member_id  uuid not null references members (id) on delete restrict,
  to_member_id    uuid not null references members (id) on delete restrict,
  amount_cents    integer not null check (amount_cents > 0),
  made_at         timestamptz not null default now(),
  method          text not null default 'other'
                    check (method in ('e_transfer','venmo','cash','other')),
  note            text,
  created_by      uuid not null references members (id) on delete restrict,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  check (from_member_id <> to_member_id)
);

create index if not exists payments_from_idx on payments (from_member_id) where deleted_at is null;
create index if not exists payments_to_idx   on payments (to_member_id)   where deleted_at is null;
create index if not exists payments_made_at_idx on payments (made_at desc) where deleted_at is null;

alter table payments enable row level security;
create policy payments_no_anon on payments for all to anon using (false) with check (false);
