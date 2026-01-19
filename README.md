# 🪙 BTC Investment Tracker

A modern, feature-rich React Native mobile application built with Expo for tracking your Bitcoin investments. Monitor your portfolio, calculate returns, track interest earnings, and manage your purchases all in one place.

![Bitcoin Tracker](https://img.shields.io/badge/Bitcoin-Tracker-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## ✨ Features

### 📊 Comprehensive Dashboard
- **Real-time Bitcoin Price** - Live BTC price from CoinGecko API
- **Investment Summary** - Track total investment and Bitcoin holdings
- **Profit/Loss Calculation** - See your gains or losses instantly
- **ROI Tracking** - Monitor your return on investment percentage
- **Equilibrium Price** - Know the break-even Bitcoin price

### 📝 Purchase Management
- **Add Purchases** - Record Bitcoin purchases with date, price, amount, and USD spent
- **Purchase History** - View all your past purchases in a clean list
- **Delete Purchases** - Remove incorrect entries easily
- **Current Price Helper** - Auto-fill BTC price with current market rate

### ⚙️ Settings & Customization
- **Interest Tracking** (Optional) - Track earnings from interest-bearing wallets
- **Manual Balance** - Set your actual wallet balance to account for interest or transfers
- **Last Updated Timestamp** - Know when you last updated your balance

### 🔐 Authentication
- **Email/Password Authentication** - Secure account creation and login
- **Social Login Support** - Google and Apple OAuth (configurable)
- **Session Management** - Persistent login with secure token storage

### 🎨 Modern UI/UX
- **Dark Theme** - Eye-friendly dark mode with Bitcoin orange accents
- **Smooth Animations** - Polished screen transitions
- **Responsive Design** - Works on all screen sizes
- **Pull to Refresh** - Update data with a simple swipe

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- Supabase account
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd btc-investment-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create your Supabase project
   - Set up database tables and RLS policies
   - Get your API credentials

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## 📱 Usage

### First Time Setup
1. Open the app and create an account
2. Sign in with your credentials
3. Add your first Bitcoin purchase
4. Watch your dashboard populate with metrics

### Adding a Purchase
1. Tap "Add Purchase" on the dashboard or purchases screen
2. Select the purchase date
3. Enter the Bitcoin price (or use "Use Current" button)
4. Enter the amount of Bitcoin purchased (supports high precision like 0.00645778)
5. Enter the USD amount spent
6. Tap "Add Purchase"

### Tracking Interest (Optional)
1. Go to Settings
2. Enable "Interest Tracking"
3. Set your annual interest rate (e.g., 7%)
4. Update your manual Bitcoin balance regularly
5. Dashboard will show interest calculations

## 🏗️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (~54.0)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (~5.9)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Storage**: AsyncStorage for local session persistence
- **API**: [CoinGecko](https://www.coingecko.com/en/api) for Bitcoin prices

## 📂 Project Structure

```
btc-investment-tracker/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Dashboard
│   │   ├── purchases.tsx         # Purchase history
│   │   └── settings.tsx          # Settings
│   ├── add-purchase.tsx          # Add purchase modal
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── DashboardCard.tsx
│   └── PurchaseListItem.tsx
├── hooks/                        # Custom React hooks
│   ├── useBitcoinPrice.ts
│   ├── usePurchases.ts
│   └── useSettings.ts
├── lib/                          # Utilities and services
│   ├── bitcoin-api.ts            # CoinGecko API wrapper
│   ├── calculations.ts           # Metric calculations
│   └── supabase.ts               # Supabase client
├── types/                        # TypeScript type definitions
│   └── database.ts
└── README.md
```

## 🗄️ Database Schema

### `purchases` Table
- `id` - Unique purchase identifier
- `user_id` - Foreign key to auth.users
- `purchase_date` - Date of purchase
- `btc_price_at_purchase` - Bitcoin price at time of purchase
- `btc_amount` - Amount of Bitcoin purchased
- `usd_spent` - USD amount spent
- `created_at` - Record creation timestamp

### `user_settings` Table
- `id` - Unique settings identifier
- `user_id` - Foreign key to auth.users (unique)
- `interest_enabled` - Whether interest tracking is enabled
- `annual_interest_rate` - Annual interest rate percentage
- `manual_btc_balance` - Manually entered Bitcoin balance
- `manual_balance_updated_at` - Last update timestamp for manual balance
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication with Supabase Auth
- API keys stored in environment variables
- No sensitive data in code

## 📊 Calculations

### Metrics Explained

- **Total Investment**: Sum of all USD spent on purchases
- **Total Bought Bitcoin**: Sum of all BTC amounts purchased
- **Real Total Bitcoin**: Manually entered actual wallet balance
- **Interest in BTC**: Real Total - Total Bought
- **Interest in USD**: Interest in BTC × Current BTC Price
- **Final Value**: Total BTC × Current Price
- **Profit/Loss**: Final Value - Total Investment
- **ROI**: (Profit / Total Investment) × 100
- **Equilibrium Price**: Total Investment / Total BTC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for the free Bitcoin price API
- [Supabase](https://supabase.com/) for the amazing backend platform
- [Expo](https://expo.dev/) for the excellent React Native framework

## 📞 Support

If you have any questions or need help setting up the app, please:
1. Check the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide
2. Review the troubleshooting section
3. Open an issue on GitHub

---

Made with ❤️ for Bitcoin investors
