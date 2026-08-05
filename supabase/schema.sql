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

-- === Fitur Budgeting ===
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

-- === Total anggaran bulanan (1 angka, terpisah dari anggaran per kategori) ===
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

-- === Kategori kustom buatan sendiri ===
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table categories enable row level security;

create policy "Users manage own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_categories_user on categories(user_id);

-- === Riwayat transfer antar rekening ===
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

