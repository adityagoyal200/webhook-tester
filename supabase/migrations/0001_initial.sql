-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Webhooks table
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  description text,
  url text not null,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- Requests table
create table if not exists public.webhook_requests (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  method text not null,
  status integer not null,
  ip text,
  user_agent text,
  headers jsonb,
  payload jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_webhook_requests_webhook_id on public.webhook_requests(webhook_id);
create index if not exists idx_webhook_requests_created_at on public.webhook_requests(created_at desc);

-- Aggregated analytics per webhook
create table if not exists public.webhook_analytics (
  webhook_id uuid primary key references public.webhooks(id) on delete cascade,
  total_requests integer default 0,
  successful_requests integer default 0,
  failed_requests integer default 0,
  avg_response_time_ms numeric default 0
);

-- User profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.webhooks enable row level security;
alter table public.webhook_requests enable row level security;
alter table public.webhook_analytics enable row level security;
alter table public.user_profiles enable row level security;

-- Create policies for webhooks table
create policy "Users can view their own webhooks" on public.webhooks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own webhooks" on public.webhooks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own webhooks" on public.webhooks
  for update using (auth.uid() = user_id);

create policy "Users can delete their own webhooks" on public.webhooks
  for delete using (auth.uid() = user_id);

-- Create policies for webhook_requests table
create policy "Users can view requests for their webhooks" on public.webhook_requests
  for select using (
    webhook_id in (
      select id from public.webhooks where user_id = auth.uid()
    )
  );

create policy "Users can insert requests for their webhooks" on public.webhook_requests
  for insert with check (
    webhook_id in (
      select id from public.webhooks where user_id = auth.uid()
    )
  );

-- Create policies for webhook_analytics table
create policy "Users can view analytics for their webhooks" on public.webhook_analytics
  for select using (
    webhook_id in (
      select id from public.webhooks where user_id = auth.uid()
    )
  );

-- Create policies for user_profiles table
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = id);

-- Create function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helpful status check
comment on table public.webhooks is 'Stores webhook endpoints for each user';
comment on table public.webhook_requests is 'Incoming HTTP request logs for webhooks';
comment on table public.webhook_analytics is 'Aggregated metrics for webhooks';
comment on table public.user_profiles is 'User profile information';