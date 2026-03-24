-- =============================================================================
-- 001_initial_schema.sql
-- Jarvis core schema
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Organisations  (tenants — one per Jarvis instance for on-prem)
-- ---------------------------------------------------------------------------
CREATE TABLE public.organisations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Default organisation — fixed UUID so the signup trigger can reference it
-- before any org is explicitly created via the admin UI.
INSERT INTO public.organisations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organisation');

-- ---------------------------------------------------------------------------
-- Profiles  (one row per auth user — identity + org membership)
-- Combines Jarvis identity fields with iso-ready org membership.
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  avatar_url  text,
  role        user_role   NOT NULL DEFAULT 'user',
  org_id      uuid        REFERENCES public.organisations(id)
                          DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup, assigned to default org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, org_id)
  VALUES (
    new.id,
    new.email,
    '00000000-0000-0000-0000-000000000001'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Instance config  (one row per Jarvis instance)
-- ---------------------------------------------------------------------------
CREATE TABLE public.instance_config (
  id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_name           text        NOT NULL DEFAULT 'Jarvis',
  primary_color           text        NOT NULL DEFAULT '#0ea5e9',
  logo_url                text,
  default_model_provider  text        NOT NULL DEFAULT 'ollama',
  default_model_name      text        NOT NULL DEFAULT 'qwen2.5:latest',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.instance_config (instance_name) VALUES ('Jarvis');

-- ---------------------------------------------------------------------------
-- Apps  (agent catalog)
-- ---------------------------------------------------------------------------
CREATE TYPE app_mount_type AS ENUM ('module', 'iframe');

CREATE TABLE public.apps (
  id          uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text           NOT NULL UNIQUE,
  name        text           NOT NULL,
  description text,
  icon        text           NOT NULL DEFAULT 'Blocks',
  version     text           NOT NULL DEFAULT '1.0.0',
  mount_type  app_mount_type NOT NULL DEFAULT 'module',
  entry_point text           NOT NULL,
  permissions text[]         NOT NULL DEFAULT '{}',
  enabled     boolean        NOT NULL DEFAULT true,
  sort_order  integer        NOT NULL DEFAULT 0,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- App usage + favorites
-- ---------------------------------------------------------------------------
CREATE TABLE public.app_usage (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id       uuid        NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  use_count    integer     NOT NULL DEFAULT 1,
  UNIQUE (user_id, app_id)
);

CREATE TABLE public.app_favorites (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id     uuid        NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

-- ---------------------------------------------------------------------------
-- Model config  (per-user AI provider overrides)
-- ---------------------------------------------------------------------------
CREATE TABLE public.model_config (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider         text        NOT NULL DEFAULT 'ollama',
  model_name       text        NOT NULL DEFAULT 'qwen2.5:latest',
  ollama_base_url  text        DEFAULT 'http://localhost:11434',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_instance_config_updated_at
  BEFORE UPDATE ON public.instance_config
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_model_config_updated_at
  BEFORE UPDATE ON public.model_config
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.organisations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instance_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_usage        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_config     ENABLE ROW LEVEL SECURITY;

-- organisations: users see their own org
CREATE POLICY "users see own org"
  ON public.organisations FOR SELECT
  USING (id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- profiles: users see/update their own; admins see all
CREATE POLICY "users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- instance_config: all authenticated can read; admins can update
CREATE POLICY "authenticated users can read instance config"
  ON public.instance_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admins can update instance config"
  ON public.instance_config FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- apps: authenticated can read enabled; admins manage all
CREATE POLICY "users can read enabled apps"
  ON public.apps FOR SELECT
  USING (auth.role() = 'authenticated' AND enabled = true);

CREATE POLICY "admins can manage apps"
  ON public.apps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- app_usage + favorites + model_config: users manage their own
CREATE POLICY "users manage own app usage"
  ON public.app_usage FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users manage own favorites"
  ON public.app_favorites FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "users manage own model config"
  ON public.model_config FOR ALL
  USING (auth.uid() = user_id);
