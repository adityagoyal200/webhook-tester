-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- =========================
-- Webhooks table
-- =========================
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  url text not null,
  status text default 'active',
  secret_key text,
  settings jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =========================
-- Webhook Requests table
-- =========================
create table if not exists public.webhook_requests (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  method text not null,
  status integer not null,
  ip_address text,
  user_agent text,
  headers jsonb,
  payload jsonb,
  response_status integer,
  processing_time_ms integer,
  created_at timestamp with time zone default now()
);

create index if not exists idx_webhook_requests_webhook_id 
  on public.webhook_requests(webhook_id);

create index if not exists idx_webhook_requests_created_at 
  on public.webhook_requests(created_at desc);

-- =========================
-- Webhook Analytics
-- =========================
create table if not exists public.webhook_analytics (
  webhook_id uuid primary key references public.webhooks(id) on delete cascade,
  total_requests integer default 0,
  successful_requests integer default 0,
  failed_requests integer default 0,
  avg_response_time_ms numeric default 0
);

-- =========================
-- User Profiles
-- =========================
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  webhook_limit integer default 5,
  request_limit integer default 1000,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =========================
-- Row Level Security
-- =========================
alter table if exists public.webhooks enable row level security;
alter table if exists public.webhook_requests enable row level security;
alter table if exists public.webhook_analytics enable row level security;
alter table if exists public.user_profiles enable row level security;

-- =========================
-- Policies: Webhooks
-- =========================
drop policy if exists "Users can view their own webhooks" on public.webhooks;
create policy "Users can view their own webhooks" 
  on public.webhooks for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own webhooks" on public.webhooks;
create policy "Users can insert their own webhooks" 
  on public.webhooks for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own webhooks" on public.webhooks;
create policy "Users can update their own webhooks" 
  on public.webhooks for update 
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own webhooks" on public.webhooks;
create policy "Users can delete their own webhooks" 
  on public.webhooks for delete 
  using (auth.uid() = user_id);

-- =========================
-- Policies: Webhook Requests
-- =========================
drop policy if exists "Users can view requests for their webhooks" on public.webhook_requests;
create policy "Users can view requests for their webhooks" 
  on public.webhook_requests for select 
  using (
    webhook_id in (
      select id from public.webhooks where user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert requests for their webhooks" on public.webhook_requests;
create policy "Users can insert requests for their webhooks" 
  on public.webhook_requests for insert 
  with check (
    webhook_id in (
      select id from public.webhooks where user_id = auth.uid()
    )
  );

-- =========================
-- Policies: Webhook Analytics
-- =========================
drop policy if exists "Users can view analytics for their webhooks" on public.webhook_analytics;
create policy "Users can view analytics for their webhooks" 
  on public.webhook_analytics for select 
  using (
    webhook_id in (
      select id from public.webhooks where user_id = auth.uid()
    )
  );

-- =========================
-- Policies: User Profiles
-- =========================
drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile" 
  on public.user_profiles for select 
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile" 
  on public.user_profiles for insert 
  with check (auth.uid() = id OR auth.role() = 'service_role');

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile" 
  on public.user_profiles for update 
  using (auth.uid() = id OR auth.role() = 'service_role');

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_key text NOT NULL UNIQUE,
  permissions text[] DEFAULT '{"read", "write"}'::text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_used_at timestamp with time zone
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

drop policy if exists "Users can view their own API keys." on public.api_keys;
CREATE POLICY "Users can view their own API keys." ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);

drop policy if exists "Users can create their own API keys." on public.api_keys;
CREATE POLICY "Users can create their own API keys." ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

drop policy if exists "Users can update their own API keys." on public.api_keys;
CREATE POLICY "Users can update their own API keys." ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

drop policy if exists "Users can delete their own API keys." on public.api_keys;
CREATE POLICY "Users can delete their own API keys." ON public.api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Note: last_used_at can be updated by application logic when an API key is used

CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamp with time zone DEFAULT now() NOT NULL,
  ip_address inet,
  device_info text,
  status text NOT NULL
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

drop policy if exists "Users can view their own login history." on public.login_history;
CREATE POLICY "Users can view their own login history." ON public.login_history
  FOR SELECT USING (auth.uid() = user_id);

drop policy if exists "Users can insert their own login history." on public.login_history;
CREATE POLICY "Users can insert their own login history." ON public.login_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================
-- Auto-update updated_at triggers
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_webhooks_updated_at') then
    create trigger trg_webhooks_updated_at
    before update on public.webhooks
    for each row execute procedure public.set_updated_at();
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated_at') then
    create trigger trg_profiles_updated_at
    before update on public.user_profiles
    for each row execute procedure public.set_updated_at();
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_api_keys_updated_at') then
    create trigger trg_api_keys_updated_at
    before update on public.api_keys
    for each row execute procedure public.set_updated_at();
  end if;
end$$;

-- =========================
-- Handle New User Profiles
-- =========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
  end if;
end$$;

-- =========================
-- Auto-update webhook_analytics
-- =========================
create or replace function public.update_webhook_analytics()
returns trigger as $$
begin
  update public.webhook_analytics
  set 
    total_requests = total_requests + 1,
    successful_requests = successful_requests + (case when new.status >= 200 and new.status < 300 then 1 else 0 end),
    failed_requests = failed_requests + (case when new.status >= 400 then 1 else 0 end),
    avg_response_time_ms = 
      ((avg_response_time_ms * (total_requests)) + coalesce(new.processing_time_ms,0)) / (total_requests + 1)
  where webhook_id = new.webhook_id;

  insert into public.webhook_analytics (webhook_id, total_requests, successful_requests, failed_requests, avg_response_time_ms)
  values (
    new.webhook_id,
    1,
    case when new.status >= 200 and new.status < 300 then 1 else 0 end,
    case when new.status >= 400 then 1 else 0 end,
    coalesce(new.processing_time_ms,0)
  )
  on conflict (webhook_id) do nothing;

  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_update_webhook_analytics') then
    create trigger trg_update_webhook_analytics
    after insert on public.webhook_requests
    for each row execute procedure public.update_webhook_analytics();
  end if;
end$$;

-- =========================
-- Comments
-- =========================
comment on table public.webhooks is 'Stores webhook endpoints for each user';
comment on table public.webhook_requests is 'Incoming HTTP request logs for webhooks';
comment on table public.webhook_analytics is 'Aggregated metrics for webhooks';
comment on table public.user_profiles is 'User profile information';

-- =========================
-- RPC: generate_webhook_secret
-- =========================
create or replace function public.generate_webhook_secret()
returns text
language sql
security definer
as $$
  select 'whsec_' || encode(gen_random_bytes(32), 'hex');
$$;

grant execute on function public.generate_webhook_secret() to authenticated;
