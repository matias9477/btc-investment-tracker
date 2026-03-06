# BTC Investment Tracker

A React Native mobile app built with Expo for tracking Bitcoin investments. Pulls purchase data directly from a Google Sheets spreadsheet, calculates portfolio metrics in real time, and supports yield tracking for interest-bearing wallets.

![Bitcoin Tracker](https://img.shields.io/badge/Bitcoin-Tracker-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## Features

### Dashboard
- **Live Bitcoin price** via CoinGecko API with 24h change
- **Total Invested** — sum of all USD spent across purchases
- **Current Value & Profit** — with and without yield, side by side for easy comparison
- **Bitcoin Holdings** — BTC purchased vs BTC in wallet (when a balance is configured)
- **Yield section** — BTC earned and its USD value (only shown when a wallet balance is configured)
- **Performance** — ROI (purchases vs wallet) and break-even price
- **Recent Activity** — last 3 purchases with a "See All" link
- Pull-to-refresh updates price, purchases, and settings simultaneously

### Google Sheets Data Source
- Connect any publicly shared Google Sheet as the purchase data source
- Configure which columns map to date, BTC price, BTC amount, and USD spent
- Header rows and non-numeric rows are automatically ignored
- Sortable purchase table (by date, price, amount, or USD spent — asc/desc)

### Bitcoin Balance (Yield Tracking)
- **Enter manually** — type your current wallet balance directly
- **From sheet cell** — point the app at a cell (e.g. `I7`) and it reads the balance automatically on every sync
- Clearing the configuration hides the Yield section from the dashboard

### Authentication
- Email/password sign-up and login
- **Google OAuth** (one tap sign-in on both login and signup screens)
- Persistent sessions via AsyncStorage

### UI
- Dark theme with Bitcoin-orange accents
- All cards support double-tap to show an explanation tooltip
- Responsive layout that works on all screen sizes

## Getting Started

### Prerequisites

- Node.js 20+ (required by React Native 0.81 and Metro)
- npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Xcode (iOS) or Android Studio (Android) for a native dev build

### 1. Clone and install

```bash
git clone <your-repo-url>
cd btc-investment-tracker
npm install
```

### 2. Create a Supabase project

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the following to create the required tables:

```sql
-- Purchase history
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  purchase_date date not null,
  btc_price_at_purchase numeric not null,
  btc_amount numeric not null,
  usd_spent numeric not null,
  created_at timestamptz default now()
);

-- User settings
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique not null,
  manual_btc_balance numeric,
  manual_btc_balance_cell text,
  manual_balance_updated_at timestamptz,
  sheets_url text,
  sheets_col_date text default 'A',
  sheets_col_price text default 'B',
  sheets_col_amount text default 'C',
  sheets_col_spent text default 'D',
  interest_enabled boolean default false,
  annual_interest_rate numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table purchases enable row level security;
alter table user_settings enable row level security;

create policy "Users can manage their own purchases"
  on purchases for all using (auth.uid() = user_id);

create policy "Users can manage their own settings"
  on user_settings for all using (auth.uid() = user_id);
```

3. In **Authentication → Providers**, enable **Google** and paste your Google OAuth Client ID and Secret.
4. In **Authentication → URL Configuration → Redirect URLs**, add:
   - `btc-tracker://auth/callback` (production / native build)
   - `exp://<your-local-ip>:8081/--/auth/callback` (Expo Go — check the log when you first tap "Continue with Google")

### 3. Configure environment variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```

Use the **legacy JWT anon key** (`eyJ...`), not the newer `sb_publishable_` format.

### 4. Run the app

**Expo Go (quickest start, OAuth needs extra Supabase config — see above):**
```bash
npx expo start --clear
```

**Native dev build (recommended for OAuth):**
```bash
npx expo run:ios   # or run:android
```

## Google Sheets Setup

1. Create a spreadsheet with your Bitcoin purchase history.
2. Set sharing to **"Anyone with the link can view"**.
3. In the app → **Settings → Google Sheets Data Source**, paste the share URL and set the column letters for each field.
4. Rows without valid numbers in the price/amount/spent columns (e.g. header rows) are automatically skipped.

**Example sheet layout:**

| A (Date)   | B (BTC Price) | C (BTC Amount) | D (USD Spent) |
|------------|---------------|----------------|---------------|
| 28-12-2024 | 95000         | 0.00052631     | 50            |

Columns can be in any order — just configure the mapping in Settings.

### Reading wallet balance from the sheet

If your spreadsheet calculates your total wallet balance (e.g. including Nexo interest) in a cell like `I7`, go to **Settings → Bitcoin Balance → From sheet cell**, enter `I7`, and save. The app will read that cell automatically on every sync instead of requiring a manual entry.

## Project Structure

```
btc-investment-tracker/
├── app/
│   ├── auth/
│   │   ├── login.tsx          # Email/password + Google login
│   │   ├── signup.tsx         # Account creation + Google sign-up
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard
│   │   ├── purchases.tsx      # Full purchase history with sorting
│   │   └── settings.tsx       # Sheet config, balance, auth
│   └── _layout.tsx            # Root layout + auth guard
├── components/
│   ├── DashboardCard.tsx      # Metric card (double-tap for tooltip)
│   ├── PortfolioHero.tsx      # Large value hero at top of dashboard
│   ├── PriceCard.tsx          # Live BTC price card
│   ├── PurchaseTable.tsx      # Sortable purchase history table
│   └── ToastProvider.tsx      # App-wide toast / tooltip context
├── hooks/
│   ├── useBitcoinPrice.ts     # CoinGecko price polling
│   ├── useGoogleAuth.ts       # Supabase + expo-web-browser OAuth flow
│   ├── usePurchases.ts        # Fetches sheet data, exposes sheetBtcBalance
│   └── useSettings.ts        # Supabase user_settings CRUD
├── lib/
│   ├── calculations.ts        # All dashboard metric calculations
│   ├── google-sheets.ts       # CSV fetch, row parsing, cell extraction
│   └── supabase.ts            # Supabase client (PKCE, AsyncStorage)
├── supabase/
│   └── migrations/            # SQL migration files
├── types/
│   └── database.ts            # TypeScript types for DB + metrics
└── .env                       # Supabase credentials (not committed)
```

## Database Schema

### `user_settings`

| Column | Type | Description |
|--------|------|-------------|
| `sheets_url` | text | Google Sheets share URL |
| `sheets_col_date` | text | Column letter for date (default: A) |
| `sheets_col_price` | text | Column letter for BTC price (default: B) |
| `sheets_col_amount` | text | Column letter for BTC amount (default: C) |
| `sheets_col_spent` | text | Column letter for USD spent (default: D) |
| `manual_btc_balance` | numeric | Manually entered wallet balance |
| `manual_btc_balance_cell` | text | Cell reference to read balance from (e.g. `I7`) |
| `manual_balance_updated_at` | timestamptz | Last balance update timestamp |

### `purchases`

Kept for schema compatibility — data is sourced from Google Sheets, not this table.

## Dashboard Metrics

| Metric | Formula |
|--------|---------|
| Total Invested | Sum of all `usd_spent` |
| Current Value (Purchases) | `totalBoughtBTC × currentPrice` |
| Current Value (Wallet) | `walletBalance × currentPrice` |
| Profit | Value − Total Invested |
| ROI | `(Profit / Total Invested) × 100` |
| Yield in BTC | `walletBalance − totalBoughtBTC` |
| Yield in USD | `yieldBTC × currentPrice` |
| Break-even | `Total Invested / totalBoughtBTC` |

When no wallet balance is configured, all wallet/yield metrics are hidden and the dashboard shows metrics based on purchases only.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo ~54 / React Native 0.81 |
| Language | TypeScript ~5.9 |
| Navigation | Expo Router (file-based) |
| Backend / Auth | Supabase (PostgreSQL + Auth) |
| OAuth | expo-auth-session + expo-web-browser |
| Data source | Google Sheets (CSV export via gviz endpoint) |
| CSV parsing | papaparse |
| Price API | CoinGecko (free tier) |
| Session storage | AsyncStorage |

## Security

- Row Level Security (RLS) enabled on all tables — users can only read their own data
- OAuth uses PKCE flow
- API keys loaded from environment variables, never committed
- Google Sheets integration requires only read-only public sharing

## Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for the free Bitcoin price API
- [Supabase](https://supabase.com/) for authentication and settings storage
- [Expo](https://expo.dev/) for the React Native framework
