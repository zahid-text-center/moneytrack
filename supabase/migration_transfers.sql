-- MIGRASI TAMBAHAN: riwayat transfer antar rekening
-- Jalankan file ini di Supabase Dashboard > SQL Editor

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references accounts(id) on delete cascade,
  to_account_id uuid not null references accounts(id) on delete cascade,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table transfers enable row level security;

create policy "Users manage own transfers"
  on transfers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_transfers_user on transfers(user_id);
