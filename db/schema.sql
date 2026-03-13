create extension if not exists pgcrypto;

create table if not exists airports (
  id uuid primary key default gen_random_uuid(),
  iata varchar(3) not null unique,
  city text not null,
  country text not null,
  region text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists airports_region_idx on airports (region);
create index if not exists airports_country_idx on airports (country);
