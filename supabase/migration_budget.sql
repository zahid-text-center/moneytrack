-- MIGRASI TAMBAHAN: fitur Budgeting
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- (aman dijalankan meski proyek sudah berjalan, tidak akan mengubah tabel lama)

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month int not null check (month between 1 and 12),
  year int not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, category, month, year)
);

alter table budgets enable row level security;

create policy "Users manage own budgets"
  on budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_budgets_user on budgets(user_id);
create index if not exists idx_budgets_month_year on budgets(user_id, month, year);
