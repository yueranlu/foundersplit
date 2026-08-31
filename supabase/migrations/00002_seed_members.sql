-- Seed the 5 cofounders. Run once, right after 00001_init.sql.
-- Idempotent via `on conflict do nothing`.

insert into members (first_name, display_name, avatar_color) values
  ('yueran', 'Yueran', '#f97316'),
  ('dory',   'Dory',   '#3b82f6'),
  ('jenny',  'Jenny',  '#ec4899'),
  ('eric',   'Eric',   '#10b981'),
  ('siva',   'Siva',   '#8b5cf6')
on conflict (first_name) do nothing;
