-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────
create type user_role as enum ('admin', 'user');

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- instance_config  (one row per instance)
-- ─────────────────────────────────────────
create table public.instance_config (
  id                      uuid primary key default uuid_generate_v4(),
  instance_name           text not null default 'Jarvis',
  primary_color           text not null default '#0ea5e9',  -- tailwind sky-500
  logo_url                text,
  default_model_provider  text not null default 'ollama',
  default_model_name      text not null default 'qwen2.5:latest',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Seed with a default row
insert into public.instance_config (instance_name) values ('Jarvis');

-- ─────────────────────────────────────────
-- apps
-- ─────────────────────────────────────────
create type app_mount_type as enum ('module', 'iframe');

create table public.apps (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon        text not null default 'Blocks',
  version     text not null default '1.0.0',
  mount_type  app_mount_type not null default 'module',
  entry_point text not null,
  permissions text[] not null default '{}',
  enabled     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- app_usage
-- ─────────────────────────────────────────
create table public.app_usage (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  app_id       uuid not null references public.apps(id) on delete cascade,
  last_used_at timestamptz not null default now(),
  use_count    integer not null default 1,
  unique(user_id, app_id)
);

-- ─────────────────────────────────────────
-- app_favorites
-- ─────────────────────────────────────────
create table public.app_favorites (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  app_id     uuid not null references public.apps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, app_id)
);

-- ─────────────────────────────────────────
-- model_config  (per-user overrides)
-- ─────────────────────────────────────────
create table public.model_config (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null unique references public.profiles(id) on delete cascade,
  provider         text not null default 'ollama',
  model_name       text not null default 'qwen2.5:latest',
  ollama_base_url  text default 'http://localhost:11434',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_instance_config_updated_at
  before update on public.instance_config
  for each row execute procedure public.set_updated_at();

create trigger set_apps_updated_at
  before update on public.apps
  for each row execute procedure public.set_updated_at();

create trigger set_model_config_updated_at
  before update on public.model_config
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.instance_config enable row level security;
alter table public.apps enable row level security;
alter table public.app_usage enable row level security;
alter table public.app_favorites enable row level security;
alter table public.model_config enable row level security;

-- profiles: users see their own, admins see all
create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- instance_config: all authenticated users can read
create policy "authenticated users can read instance config"
  on public.instance_config for select
  using (auth.role() = 'authenticated');

create policy "admins can update instance config"
  on public.instance_config for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- apps: all authenticated users can read enabled apps
create policy "users can read enabled apps"
  on public.apps for select
  using (auth.role() = 'authenticated' and enabled = true);

create policy "admins can manage apps"
  on public.apps for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- app_usage: users manage their own
create policy "users manage own app usage"
  on public.app_usage for all
  using (auth.uid() = user_id);

-- app_favorites: users manage their own
create policy "users manage own favorites"
  on public.app_favorites for all
  using (auth.uid() = user_id);

-- model_config: users manage their own
create policy "users manage own model config"
  on public.model_config for all
  using (auth.uid() = user_id);
