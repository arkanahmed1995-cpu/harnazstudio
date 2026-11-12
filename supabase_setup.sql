-- HARNaz Studio: run this in Supabase SQL Editor AFTER creating your one admin user.
-- Replace ADMIN_USER_UUID with the Auth user UUID shown in Authentication > Users.

create table if not exists public.studio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.studio_admins enable row level security;

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.studio_admins where user_id = auth.uid());
$$;

revoke all on function public.is_studio_admin() from public;
grant execute on function public.is_studio_admin() to authenticated;
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;

drop policy if exists "Public can read HARNaz portfolio" on public.portfolio_items;
create policy "Public can read HARNaz portfolio"
on public.portfolio_items for select to anon, authenticated using (true);

drop policy if exists "Only HARNaz admin can add portfolio items" on public.portfolio_items;
create policy "Only HARNaz admin can add portfolio items"
on public.portfolio_items for insert to authenticated
with check (public.is_studio_admin());

drop policy if exists "Only HARNaz admin can edit portfolio items" on public.portfolio_items;
create policy "Only HARNaz admin can edit portfolio items"
on public.portfolio_items for update to authenticated
using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "Only HARNaz admin can delete portfolio items" on public.portfolio_items;
create policy "Only HARNaz admin can delete portfolio items"
on public.portfolio_items for delete to authenticated
using (public.is_studio_admin());

-- Public visitors can view images because the bucket is public.
-- Upload and delete actions remain restricted to the registered admin user.
drop policy if exists "Only HARNaz admin can upload portfolio images" on storage.objects;
create policy "Only HARNaz admin can upload portfolio images"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio' and public.is_studio_admin());

drop policy if exists "Only HARNaz admin can delete portfolio images" on storage.objects;
create policy "Only HARNaz admin can delete portfolio images"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio' and public.is_studio_admin());

-- Add your Auth user's UUID below, then execute this INSERT separately.
-- insert into public.studio_admins (user_id) values ('ADMIN_USER_UUID');
