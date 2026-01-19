# Supabase Setup Guide

This guide will help you set up Supabase for your BTC Investment Tracker app.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `btc-investment-tracker`
   - Database Password: (generate a strong password)
   - Region: Choose closest to you
5. Click "Create new project"

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (under Project URL)
   - **anon public** key (under Project API keys)

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Paste and run the following SQL:

```sql
-- Create purchases table
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_date DATE NOT NULL,
  btc_price_at_purchase DECIMAL(20, 2) NOT NULL,
  btc_amount DECIMAL(20, 8) NOT NULL,
  usd_spent DECIMAL(20, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  interest_enabled BOOLEAN DEFAULT FALSE,
  annual_interest_rate DECIMAL(5, 2),
  manual_btc_balance DECIMAL(20, 8),
  manual_balance_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

## Step 5: Set Up Row Level Security (RLS)

1. In the SQL Editor, run the following to enable RLS:

```sql
-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Purchases policies
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
  ON purchases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
  ON purchases FOR DELETE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

## Step 6: Enable Email Authentication

1. Go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Configure email settings if needed

## Step 7: (Optional) Enable Social Authentication

### Google OAuth

1. Go to **Authentication** > **Providers**
2. Click on **Google**
3. Enable the provider
4. Follow the instructions to set up Google OAuth credentials
5. Add your OAuth credentials

### Apple OAuth

1. Go to **Authentication** > **Providers**
2. Click on **Apple**
3. Enable the provider
4. Follow the instructions to set up Apple Sign In
5. Add your credentials

## Step 8: Test Your Setup

1. Start your Expo app:
   ```bash
   npm start
   ```

2. Try signing up with a test account
3. Add a test purchase
4. Verify the data appears in your Supabase dashboard

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct credentials
- Make sure the environment variable names start with `EXPO_PUBLIC_`
- Restart your Expo server after changing `.env`

### "Row Level Security" errors
- Verify RLS policies are created correctly
- Check that policies use `auth.uid()` correctly

### Data not appearing
- Check the browser console / React Native debugger for errors
- Verify your user is authenticated
- Check Supabase logs in the dashboard

## Next Steps

Your Supabase backend is now ready! You can:
- Start using the app
- Add more features
- Customize the database schema
- Set up backups and monitoring in Supabase dashboard
