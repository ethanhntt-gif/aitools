create table if not exists public.profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  owner_email text,
  display_name text,
  headline text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
