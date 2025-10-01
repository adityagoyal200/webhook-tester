# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`

## Database Setup

After setting up your environment variables:

1. Run the Supabase migrations (see `supabase/README.md` for detailed instructions)
2. Or manually run the SQL in `supabase/migrations/0001_initial.sql` in your Supabase SQL editor

## Troubleshooting

- Make sure your `.env` file is in the project root (same level as `package.json`)
- Restart your development server after adding environment variables
- Ensure your Supabase project is active (not paused)
- Check that the migration has been applied successfully

## Security Notes

- Never commit your `.env` file to version control
- The `VITE_SUPABASE_ANON_KEY` is safe to use in client-side code
- Row Level Security (RLS) is enabled on all tables for data protection
