using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StayConnect.Infrastructure.Migrations;

/// <inheritdoc />
public partial class EnsureCoreTables : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            create extension if not exists pgcrypto;

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
              response_rate numeric(5,2) null,
              response_time text null,
              password_hash text not null default '',
              role text not null default 'guest',
              created_at timestamptz not null default now(),
              updated_at timestamptz null
            );

            alter table public.users add column if not exists password_hash text not null default '';
            alter table public.users add column if not exists role text not null default 'guest';
            update public.users set role = case when is_host then 'host' else 'guest' end where role is null or role = '';

            create unique index if not exists ux_users_email on public.users (email);
            create index if not exists ix_users_is_host on public.users (is_host);

            create table if not exists public.properties (
              id uuid primary key default gen_random_uuid(),
              host_id uuid not null references public.users(id) on delete cascade,
              title varchar(160) not null,
              description text not null,
              type varchar(60) not null,
              address varchar(500) not null,
              city varchar(120) not null,
              state varchar(120) not null,
              country varchar(120) not null default 'India',
              latitude numeric(10,7) null,
              longitude numeric(10,7) null,
              base_price numeric(12,2) not null,
              cleaning_fee numeric(12,2) not null default 0,
              service_fee numeric(12,2) not null default 0,
              currency varchar(8) not null default 'INR',
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
              updated_at timestamptz null
            );

            do $$
            begin
              if not exists (
                select 1 from pg_constraint where conname = 'ck_properties_type'
              ) then
                alter table public.properties add constraint ck_properties_type check (type in ('entire-home', 'private-room', 'shared-room'));
              end if;
            end $$;

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
              status varchar(30) not null default 'pending',
              payment_status varchar(30) not null default 'pending',
              special_requests text null,
              cancellation_reason text null,
              created_at timestamptz not null default now(),
              updated_at timestamptz null
            );

            do $$
            begin
              if not exists (
                select 1 from pg_constraint where conname = 'ck_bookings_check_out_after_check_in'
              ) then
                alter table public.bookings add constraint ck_bookings_check_out_after_check_in check (check_out > check_in);
              end if;
            end $$;

            create index if not exists ix_bookings_property_id on public.bookings (property_id);
            create index if not exists ix_bookings_guest_id on public.bookings (guest_id);
            create index if not exists ix_bookings_host_id on public.bookings (host_id);
            create index if not exists ix_bookings_dates on public.bookings (check_in, check_out);
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            drop table if exists public.bookings;
            drop table if exists public.properties;
            drop table if exists public.users;
            """);
    }
}
