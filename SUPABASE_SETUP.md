# Supabase Setup Guide for Taski

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `taski` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on "Settings" (gear icon in the sidebar)
2. Click on "API" in the settings menu
3. Copy the following values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **Anon/Public Key** (a long string starting with "eyJ...")

## Step 3: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important:** Never commit the `.env.local` file to version control. It's already in `.gitignore`.

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, click on "SQL Editor" in the sidebar
2. Click "New Query"
3. First, copy and paste the contents of `supabase-schema.sql` and click "Run"
4. Then, copy and paste the contents of `supabase-profiles-schema.sql` and click "Run"

This will create:
- `habits` table - Stores user habits
- `daily_completions` table - Tracks daily habit completions
- `sticky_notes` table - Stores sticky notes
- `user_profiles` table - Stores user display names
- Row Level Security policies - Ensures users can only access their own data
- Indexes - For better query performance

## Step 5: Enable Email Authentication

1. In Supabase dashboard, click "Authentication" in the sidebar
2. Click "Providers"
3. Make sure "Email" provider is enabled (it usually is by default)
4. Configure email templates (optional):
   - Go to "Email Templates"
   - Customize the confirmation and password reset emails

## Step 6: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Click the user icon in the top-right corner

4. Click "Sign up" and create a test account

5. Check your email for the confirmation link

6. After confirming, sign in to test the authentication

## Features Available After Setup

Once configured, you'll have:

### Authentication
- ✅ Email sign-up with confirmation
- ✅ Email sign-in
- ✅ User profiles with editable display names
- ✅ Secure session management
- ✅ Sign-out functionality

### Cross-Device Sync
- ✅ Habits sync automatically across devices
- ✅ Sticky notes sync across devices
- ✅ Real-time updates when changes are made on another device
- ✅ Offline support with local storage fallback

### Themes
- ✅ Classic theme (original monospace design)
- ✅ Neomorphic "Soft" theme (modern soft shadows)
- ✅ Theme preference saved per user
- ✅ Smooth theme transitions

## Troubleshooting

### "Cannot find module" errors
- Make sure all dependencies are installed: `npm install`
- Restart your development server

### Authentication not working
- Check that your `.env.local` has the correct Supabase URL and key
- Verify email provider is enabled in Supabase dashboard
- Check browser console for error messages

### Data not syncing
- Make sure you're signed in (check top-right corner)
- Verify the database schema was created successfully
- Check Supabase logs in the dashboard under "Logs"

### Theme not persisting
- Theme preference is saved to localStorage
- Make sure cookies/localStorage are enabled in your browser

## Security Notes

- The Anon Key is safe to expose in client-side code
- Row Level Security (RLS) policies protect user data
- Each user can only access their own habits and notes
- Never share your Supabase Service Role Key (not used in this app)

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
