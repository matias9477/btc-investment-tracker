/**
 * Database types for Supabase tables
 */

export interface Purchase {
  id: string;
  user_id: string;
  purchase_date: string;
  btc_price_at_purchase: number;
  btc_amount: number;
  usd_spent: number;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  interest_enabled: boolean;
  annual_interest_rate: number | null;
  manual_btc_balance: number | null;
  manual_balance_updated_at: string | null;
  /** Full Google Sheets share URL, or null when not configured */
  sheets_url: string | null;
  /** Column letter for the purchase date field (e.g. 'A') */
  sheets_col_date: string;
  /** Column letter for the BTC price at purchase field (e.g. 'B') */
  sheets_col_price: string;
  /** Column letter for the BTC amount field (e.g. 'C') */
  sheets_col_amount: string;
  /** Column letter for the USD spent field (e.g. 'D') */
  sheets_col_spent: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  currentBtcPrice: number;
  totalInvestment: number;
  totalBoughtBitcoin: number;
  manualTotalBitcoin: number | null;
  manualBalanceUpdatedAt: string | null;
  // Comparative metrics
  finalValuePurchased: number;
  finalValueReal: number;
  profitPurchased: number;
  profitReal: number;
  roiPurchased: number;
  roiReal: number;
  // Interest metrics
  interestInBtc: number;
  interestInUsd: number;
  equilibriumPrice: number;
}

export interface Database {
  public: {
    Tables: {
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, 'id' | 'created_at'>;
        Update: Partial<Omit<Purchase, 'id' | 'user_id' | 'created_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
