/**
 * Bitcoin price fetching service using CoinGecko API
 */

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Fetches the current Bitcoin price in USD from CoinGecko
 * @returns Current Bitcoin price in USD
 */
export const fetchBitcoinPrice = async (): Promise<number> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Bitcoin price: ${response.status}`);
    }
    
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw new Error('Failed to fetch Bitcoin price. Please try again.');
  }
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
