# 🚀 Quick Start Guide

Get your BTC Investment Tracker up and running in minutes!

## Prerequisites Checklist

Before you begin, make sure you have:
- ✅ Node.js installed (v18 or higher)
- ✅ npm or yarn installed
- ✅ A Supabase account (free tier is fine)
- ✅ Expo Go app installed on your phone (optional, for testing on device)

## 5-Minute Setup

### Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

### Step 2: Set Up Supabase (2-3 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it "btc-investment-tracker"
   - Wait for it to initialize

2. **Run Database Setup**
   - In Supabase dashboard, go to **SQL Editor**
   - Copy the SQL from `SUPABASE_SETUP.md` (Step 4 and Step 5)
   - Paste and run each SQL block

3. **Get Your Keys**
   - Go to **Settings** > **API**
   - Copy your `Project URL` and `anon public` key

### Step 3: Configure Environment (1 minute)

```bash
# Create .env file
cp .env.example .env

# Edit .env and paste your Supabase credentials
# EXPO_PUBLIC_SUPABASE_URL=your_url_here
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Step 4: Start the App (30 seconds)

```bash
npm start
```

That's it! 🎉

## Testing the App

### On Your Phone (Easiest)
1. Install Expo Go from App Store or Play Store
2. Scan the QR code shown in your terminal
3. App will open in Expo Go

### On iOS Simulator (Mac only)
```bash
npm run ios
```

### On Android Emulator
```bash
npm run android
```

### On Web Browser
```bash
npm run web
```

## First Use

1. **Create Account**
   - Open the app
   - Tap "Sign Up"
   - Enter email and password
   - Sign up

2. **Add First Purchase**
   - Tap "Add Purchase" on dashboard
   - Select purchase date
   - Tap "Use Current" to get current BTC price
   - Enter BTC amount (e.g., 0.00645778)
   - Enter USD spent (e.g., 500.00)
   - Tap "Add Purchase"

3. **View Dashboard**
   - Your metrics will appear automatically
   - Pull down to refresh Bitcoin price

4. **Optional: Enable Interest Tracking**
   - Go to Settings tab
   - Enable "Interest Tracking"
   - Set your annual rate (e.g., 7)
   - Enter your manual wallet balance
   - Tap "Update Balance"

## Troubleshooting

### "Invalid API key" Error
```bash
# Make sure your .env file exists and has correct values
# Restart Expo server after changing .env
npm start -- --clear
```

### App Won't Load
```bash
# Clear Expo cache and restart
npm start -- --clear
```

### Supabase Connection Issues
- Verify your Supabase project is active
- Check that database tables were created
- Verify RLS policies are in place

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## What's Next?

- ✨ Add all your Bitcoin purchases
- 📊 Monitor your portfolio daily
- 💰 Track your ROI
- ⚙️ Customize settings to your needs

## Need More Help?

- 📖 Read the full [README.md](./README.md)
- 🗄️ Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed database setup
- 🐛 Open an issue on GitHub

---

Happy tracking! 🪙
