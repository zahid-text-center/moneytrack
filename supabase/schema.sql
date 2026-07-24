-- Jalankan script ini di Supabase Dashboard > SQL Editor

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;
alter table transactions enable row level security;

-- Setiap user hanya bisa melihat & mengubah datanya sendiri
create policy "Users manage own accounts"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_accounts_user on accounts(user_id);
create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_transactions_date on transactions(date);
