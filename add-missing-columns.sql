-- Add missing columns to fix "Could not find column" errors
-- Copy this entire content and paste into Supabase SQL Editor

-- Add missing columns to webhooks table
ALTER TABLE public.webhooks 
ADD COLUMN IF NOT EXISTS secret_key text,
ADD COLUMN IF NOT EXISTS settings jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default now();

-- Add missing columns to webhook_requests table
ALTER TABLE public.webhook_requests 
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS response_status integer,
ADD COLUMN IF NOT EXISTS processing_time_ms integer;

-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS webhook_limit integer default 5,
ADD COLUMN IF NOT EXISTS request_limit integer default 1000;

-- Update existing records to have default values
UPDATE public.webhooks SET settings = '{}' WHERE settings IS NULL;
UPDATE public.user_profiles SET webhook_limit = 5 WHERE webhook_limit IS NULL;
UPDATE public.user_profiles SET request_limit = 1000 WHERE request_limit IS NULL;

-- Verify the changes
SELECT 'webhooks table updated' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'webhooks' AND table_schema = 'public'
ORDER BY ordinal_position;
