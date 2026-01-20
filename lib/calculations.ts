import { Purchase, UserSettings, DashboardMetrics } from '../types/database';

/**
 * Calculates all dashboard metrics based on purchases, settings, and current BTC price
 */
export const calculateDashboardMetrics = (
  purchases: Purchase[],
  settings: UserSettings | null,
  currentBtcPrice: number
): DashboardMetrics => {
  // Calculate total investment (sum of all USD spent)
  const totalInvestment = purchases.reduce((sum, p) => sum + p.usd_spent, 0);

  // Calculate total bought Bitcoin (sum of all BTC amounts)
  const totalBoughtBitcoin = purchases.reduce((sum, p) => sum + p.btc_amount, 0);

  // Get manual balance from settings
  const manualTotalBitcoin = settings?.manual_btc_balance ?? null;
  const manualBalanceUpdatedAt = settings?.manual_balance_updated_at ?? null;

  // 1. Purchased Metrics (Based only on transactions)
  const finalValuePurchased = totalBoughtBitcoin * currentBtcPrice;
  const profitPurchased = finalValuePurchased - totalInvestment;
  const roiPurchased = totalInvestment > 0 ? (profitPurchased / totalInvestment) * 100 : 0;

  // 2. Real Metrics (Based on manual balance if available, otherwise same as purchased)
  const finalValueReal = manualTotalBitcoin !== null ? manualTotalBitcoin * currentBtcPrice : finalValuePurchased;
  const profitReal = finalValueReal - totalInvestment;
  const roiReal = totalInvestment > 0 ? (profitReal / totalInvestment) * 100 : 0;

  // 3. Interest Metrics (Difference between real and purchased)
  const interestInBtc = manualTotalBitcoin !== null ? manualTotalBitcoin - totalBoughtBitcoin : 0;
  const interestInUsd = interestInBtc * currentBtcPrice;

  // Calculate equilibrium price (break-even)
  const equilibriumPrice = totalBoughtBitcoin > 0 ? totalInvestment / totalBoughtBitcoin : 0;

  return {
    currentBtcPrice,
    totalInvestment,
    totalBoughtBitcoin,
    manualTotalBitcoin,
    manualBalanceUpdatedAt,
    finalValuePurchased,
    finalValueReal,
    profitPurchased,
    profitReal,
    roiPurchased,
    roiReal,
    interestInBtc,
    interestInUsd,
    equilibriumPrice,
  };
};

/**
 * Formats a number as USD currency safely
 */
export const formatUSD = (amount: number | undefined | null): string => {
  const value = amount ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats a number as Bitcoin with high precision safely
 */
export const formatBTC = (amount: number | undefined | null): string => {
  const value = amount ?? 0;
  return value.toFixed(8) + ' BTC';
};

/**
 * Formats a percentage value safely
 */
export const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '+0.00%';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Formats a date string to DD/MM/YY format
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a date to ISO string (YYYY-MM-DD) for storage
 */
export const formatDateForStorage = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formats a date to DD/MM/YYYY for input display
 */
export const formatDateForInput = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Parses DD/MM/YYYY string to Date object
 * Returns null if invalid format
 */
export const parseDateFromInput = (dateString: string): Date | null => {
  // Remove any whitespace
  const cleaned = dateString.trim();
  
  // Check format DD/MM/YYYY (must have slashes)
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleaned.match(dateRegex);
  
  if (!match) {
    return null;
  }
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Validate month range (1-12)
  if (month < 1 || month > 12) {
    return null;
  }
  
  // Validate day range (1-31, but will check against month later)
  if (day < 1 || day > 31) {
    return null;
  }
  
  // Validate year range (1900 to current year)
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return null;
  }
  
  // Create date (month is 0-indexed in JS Date)
  const date = new Date(year, month - 1, day);
  
  // Validate the date is valid (catches invalid dates like Feb 30, Apr 31, etc.)
  if (date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year) {
    return null;
  }
  
  // Don't allow future dates (including today's future time)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(year, month - 1, day);
  
  if (inputDate > today) {
    return null;
  }
  
  return date;
};
