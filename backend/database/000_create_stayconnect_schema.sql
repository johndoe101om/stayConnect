-- StayConnect Supabase PostgreSQL schema
-- Run this once in Supabase SQL Editor before using the ASP.NET Core backend.
-- Safe to rerun: tables, indexes, and columns are created only when missing.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  last_name text not null,
  avatar text null,
  phone text null,
  is_host boolean not null default false,
  is_verified boolean not null default false,
  joined_date timestamptz not null default now(),
  rating numeric(3,2) null,
  review_count integer not null default 0,
  bio text null,
  languages text[] null default '{}',
  response_rate integer null,
  response_time text null,
  password_hash text null,
  role text not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_users_email_lower on public.users (lower(email));
create index if not exists ix_users_is_host on public.users (is_host);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  type text not null check (type in ('entire-home', 'private-room', 'shared-room')),
  address text not null,
  city text not null,
  state text not null,
  country text not null,
  latitude numeric(10,7) null,
  longitude numeric(10,7) null,
  base_price numeric(12,2) not null,
  cleaning_fee numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  currency text not null default 'INR',
  guests integer not null,
  bedrooms integer not null,
  beds integer not null,
  bathrooms integer not null,
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  min_stay integer not null default 1,
  max_stay integer not null default 30,
  instant_book boolean not null default false,
  rules text[] not null default '{}',
  rating numeric(3,2) null,
  review_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_properties_host_id on public.properties (host_id);
create index if not exists ix_properties_city on public.properties (city);
create index if not exists ix_properties_is_active on public.properties (is_active);
create index if not exists ix_properties_rating on public.properties (rating desc);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_id uuid not null references public.users(id) on delete cascade,
  host_id uuid not null references public.users(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  guests integer not null,
  total_price numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  special_requests text null,
  cancellation_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_bookings_check_out_after_check_in check (check_out > check_in)
);

create index if not exists ix_bookings_property_id on public.bookings (property_id);
create index if not exists ix_bookings_guest_id on public.bookings (guest_id);
create index if not exists ix_bookings_host_id on public.bookings (host_id);
create index if not exists ix_bookings_dates on public.bookings (check_in, check_out);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewee_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  type text not null check (type in ('guest-to-host', 'host-to-guest')),
  accuracy_rating integer null check (accuracy_rating between 1 and 5),
  communication_rating integer null check (communication_rating between 1 and 5),
  cleanliness_rating integer null check (cleanliness_rating between 1 and 5),
  location_rating integer null check (location_rating between 1 and 5),
  checkin_rating integer null check (checkin_rating between 1 and 5),
  value_rating integer null check (value_rating between 1 and 5),
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid null references public.bookings(id) on delete set null,
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'booking_request', 'system')),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlist_properties (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint ux_wishlist_properties_unique unique (wishlist_id, property_id)
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'general' check (category in ('general', 'tips', 'events', 'local_insights')),
  tags text[] not null default '{}',
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  parent_id uuid null references public.community_comments(id) on delete cascade,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.users(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  page_url text null,
  referrer text null,
  user_agent text null,
  ip_address text null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  payment_method text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text null,
  refund_amount numeric(12,2) null,
  refund_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add backend auth columns to existing user tables if the table already existed without them.
alter table public.users add column if not exists password_hash text null;
alter table public.users add column if not exists role text not null default 'guest';
update public.users set role = case when is_host then 'host' else 'guest' end where role is null or role = '';

-- Updated-at triggers.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'properties', 'bookings', 'reviews', 'messages', 'wishlists',
    'community_posts', 'community_comments', 'payments'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;
