-- Quick fix for webhook analytics RLS policy violation
-- Run this in your Supabase SQL editor

-- Drop and recreate the analytics update function with RLS bypass
drop function if exists public.update_webhook_analytics() cascade;

create or replace function public.update_webhook_analytics()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Temporarily disable RLS for this function
  set local row_security = off;
  
  update public.webhook_analytics
  set 
    total_requests = total_requests + 1,
    successful_requests = successful_requests + (case when new.status >= 200 and new.status < 300 then 1 else 0 end),
    failed_requests = failed_requests + (case when new.status >= 400 then 1 else 0 end),
    avg_response_time_ms = 
      ((avg_response_time_ms * (total_requests)) + coalesce(new.processing_time_ms,0)) / (total_requests + 1)
  where webhook_id = new.webhook_id;

  -- If no rows were updated, insert a new record
  if not found then
    insert into public.webhook_analytics (webhook_id, total_requests, successful_requests, failed_requests, avg_response_time_ms)
    values (
      new.webhook_id,
      1,
      case when new.status >= 200 and new.status < 300 then 1 else 0 end,
      case when new.status >= 400 then 1 else 0 end,
      coalesce(new.processing_time_ms,0)
    );
  end if;

  return new;
end$$;

-- Recreate the trigger
drop trigger if exists trg_update_webhook_analytics on public.webhook_requests;
create trigger trg_update_webhook_analytics
after insert on public.webhook_requests
for each row execute procedure public.update_webhook_analytics();

-- Also add the missing login_history table if it doesn't exist
create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamp with time zone default now(),
  ip_address text,
  device_info text,
  status text default 'success'
);

-- Enable RLS for login_history
alter table public.login_history enable row level security;

-- Add RLS policies for login_history
drop policy if exists "Users can view their own login history" on public.login_history;
create policy "Users can view their own login history" 
  on public.login_history for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own login history" on public.login_history;
create policy "Users can insert their own login history" 
  on public.login_history for insert 
  with check (auth.uid() = user_id);
