# Quick Database Fix - Missing Columns

## 🚨 **Current Issue**
You're getting: "Could not find the 'secret_key' column of 'webhooks' in the schema cache"

This means your existing tables are missing some columns that the application expects.

## ✅ **Quick Fix: Add Missing Columns**

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/ssetcwsmgapzvwerhgic
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Run This SQL
Copy this entire SQL script and paste it into the SQL Editor, then click "Run":

```sql
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
```

### Step 3: Verify the Fix
After running the SQL:
1. Go to "Table Editor" in your Supabase dashboard
2. Click on the `webhooks` table
3. You should now see these columns:
   - `secret_key`
   - `settings`
   - `updated_at`

### Step 4: Test Your Application
1. Refresh your app at http://localhost:5173/
2. Try creating a webhook
3. The error should be gone!

## 🎯 **Alternative: Reset and Start Fresh**

If you want to start completely fresh:

### Drop All Tables (DANGER: Deletes all data!)
```sql
-- ONLY run this if you want to delete all existing data
DROP TABLE IF EXISTS public.webhook_analytics CASCADE;
DROP TABLE IF EXISTS public.webhook_requests CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
```

Then run the complete migration from `supabase/migrations/0001_initial.sql`

## 🚀 **After the Fix**

Your application should now work with:
- ✅ Webhook creation
- ✅ All database operations
- ✅ User management
- ✅ All buttons functional

The missing columns error will be resolved!
