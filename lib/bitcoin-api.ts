/**
 * Bitcoin price fetching service using CoinGecko API
 */

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface BitcoinPriceData {
  usd: number;
  usd_24h_change?: number;
}

/**
 * Fetches the current Bitcoin price in USD from CoinGecko
 * @returns Current Bitcoin price in USD and 24h change
 */
export const fetchBitcoinPriceData = async (): Promise<BitcoinPriceData> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin price: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      usd: data.bitcoin.usd,
      usd_24h_change: data.bitcoin.usd_24h_change
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw new Error('Failed to fetch Bitcoin price. Please try again.');
  }
};

/**
 * @deprecated Use fetchBitcoinPriceData instead
 */
export const fetchBitcoinPrice = async (): Promise<number> => {
  const data = await fetchBitcoinPriceData();
  return data.usd;
};

/**
 * Fetches Bitcoin price history for a specific date
 * @param date Date string in YYYY-MM-DD format
 * @returns Bitcoin price in USD for that date
 */
export const fetchBitcoinPriceForDate = async (date: string): Promise<number> => {
  try {
    // CoinGecko expects date in DD-MM-YYYY format
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}-${month}-${year}`;
    
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/bitcoin/history?date=${formattedDate}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin price for date: ${response.status}`);
    }
    
    const data = await response.json();
    return data.market_data.current_price.usd;
  } catch (error) {
    console.error('Error fetching Bitcoin price for date:', error);
    throw new Error('Failed to fetch Bitcoin price for the selected date.');
  }
};
