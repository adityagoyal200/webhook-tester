# Supabase Migrations

This project includes SQL migrations for the required tables used by the app.

## Prerequisites
- Supabase project created
- Project `URL` and `anon` key added to `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Supabase CLI installed

## Environment Setup
1. Copy `.env.example` to `.env` in your project root
2. Replace the placeholder values with your actual Supabase project credentials:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Settings > API
   - Copy the Project URL and anon public key
   - Update your `.env` file with these values

## Apply migrations via CLI
1. Login: `supabase login`
2. Link your project: `supabase link --project-ref <YOUR_PROJECT_REF>`
3. Push DB schema: `supabase db push`

This will run files under `supabase/migrations/` on your project.

## Alternative: Apply via SQL editor
If you prefer, copy-paste the contents of `supabase/migrations/0001_initial.sql` into the Supabase Studio SQL editor and run it.

## Verify tables
Run these quick checks in the SQL editor:

```sql
select count(*) from public.webhooks;
select count(*) from public.webhook_requests;
select * from public.webhook_analytics limit 5;
```

## Seeding (optional)
You can insert sample webhooks to see data in the Dashboard:

```sql
insert into public.webhooks (name, description, url, status)
values
  ('Payment Gateway', 'Stripe payment confirmations', 'https://example.com/webhooks/stripe', 'active'),
  ('User Registration', 'New user signup notifications', 'https://example.com/webhooks/register', 'active');
```

After pushing, reload the app; the Dashboard and Webhook Details pages will be ready to query these tables.