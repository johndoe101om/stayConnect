-- Run this in the Supabase SQL editor before using ASP.NET Core login.
-- Supabase is used only as PostgreSQL storage. Authentication is handled by ASP.NET Core.

alter table public.users
  add column if not exists password_hash text,
  add column if not exists role text not null default 'guest';

create unique index if not exists ux_users_email_lower
  on public.users (lower(email));

update public.users
set role = case when is_host = true then 'host' else 'guest' end
where role is null;
