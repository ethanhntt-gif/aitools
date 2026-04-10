create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  project_url text not null,
  owner_id uuid not null,
  owner_email text,
  logo_url text not null,
  image_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.projects enable row level security;

create policy "Anyone can read projects"
on public.projects
for select
to anon, authenticated
using (true);

create policy "Authenticated users can insert projects"
on public.projects
for insert
to authenticated
with check (true);
