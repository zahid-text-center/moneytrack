-- MIGRASI TAMBAHAN: total anggaran bulanan (1 angka, bukan per kategori)
-- Jalankan file ini di Supabase Dashboard > SQL Editor

create table if not exists total_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month, year)
);

alter table total_budgets enable row level security;

create policy "Users manage own total budgets"
  on total_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_total_budgets_user on total_budgets(user_id);
