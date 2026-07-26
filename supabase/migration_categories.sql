-- MIGRASI TAMBAHAN: kategori kustom buatan sendiri
-- Jalankan file ini di Supabase Dashboard > SQL Editor

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
