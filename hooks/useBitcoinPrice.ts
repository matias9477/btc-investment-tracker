import { useState, useEffect, useRef } from 'react';
import { fetchBitcoinPrice } from '../lib/bitcoin-api';

/**
 * Custom hook to fetch and manage Bitcoin price with rate limiting
 * Rate limit: 1 minute cooldown between fetches
 */
export const useBitcoinPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const lastFetchedTime = useRef<number>(0);
  const RATE_LIMIT_MS = 60 * 1000; // 1 minute

  const refresh = async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchedTime.current;

    // Rate limiting: don't fetch if less than 1 minute has passed (unless forced)
    if (!force && timeSinceLastFetch < RATE_LIMIT_MS && lastFetchedTime.current > 0) {
      return; // Skip fetch if rate limited
    }

    setLoading(true);
    setError(null);
    try {
      const btcPrice = await fetchBitcoinPrice();
      setPrice(btcPrice);
      setFetchedAt(new Date());
      lastFetchedTime.current = now;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { price, loading, error, fetchedAt, refresh };
};
