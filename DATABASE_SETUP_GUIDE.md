# Database Setup Guide - Fix "Could not find table" Error

## 🚨 **Current Issue**
You're getting the error: "Could not find the table 'public.webhooks' in the schema cache"

This means the database tables haven't been created in your Supabase project yet.

## ✅ **Solution: Apply Database Migration**

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project: `ssetcwsmgapzvwerhgic`

2. **Open SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration**:
   - Open the file `supabase/migrations/0001_initial.sql`
   - Copy ALL the content
   - Paste it into the SQL Editor

4. **Run the Migration**:
   - Click "Run" button
   - Wait for it to complete successfully

### Method 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref ssetcwsmgapzvwerhgic

# Push the migration
supabase db push
```

## 📋 **What the Migration Creates**

The migration will create these tables:

1. **`public.webhooks`** - Stores webhook endpoints
2. **`public.webhook_requests`** - Stores incoming requests
3. **`public.webhook_analytics`** - Stores aggregated analytics
4. **`public.user_profiles`** - Stores user profile information

Plus:
- Row Level Security (RLS) policies
- Database triggers
- Proper relationships between tables

## 🔍 **Verify Tables Were Created**

After running the migration:

1. Go to "Table Editor" in your Supabase dashboard
2. You should see these tables:
   - `webhooks`
   - `webhook_requests` 
   - `webhook_analytics`
   - `user_profiles`

## 🧪 **Test the Fix**

1. **Refresh your application** at http://localhost:5173/
2. **Try to register a new account**
3. **Try to create a webhook**
4. **Check browser console** - should no longer see table errors

## 🐛 **If You Still Get Errors**

### Check RLS Policies
Make sure Row Level Security is enabled:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Check Table Existence
```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Reset and Recreate
If something went wrong, you can reset:
```sql
-- Drop all tables (DANGER: This deletes all data!)
DROP TABLE IF EXISTS public.webhook_analytics CASCADE;
DROP TABLE IF EXISTS public.webhook_requests CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Then re-run the migration
```

## 🚀 **After Migration is Applied**

Your application should work with:
- ✅ User registration/login
- ✅ Webhook creation
- ✅ Webhook management (view, delete, copy)
- ✅ Dashboard with real data
- ✅ All buttons functional

## 📞 **Need Help?**

If you're still having issues:
1. Check the Supabase dashboard for any error messages
2. Look at the browser console for detailed error logs
3. Verify your Supabase project is active (not paused)
4. Make sure you're using the correct project URL and API key

The migration is in: `supabase/migrations/0001_initial.sql`
