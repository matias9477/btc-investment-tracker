import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Purchase } from '../types/database';
import { fetchSheetPurchases, SheetColumnConfig } from '../lib/google-sheets';

/**
 * Custom hook that provides purchase data sourced from a configured Google Sheet.
 *
 * On mount it reads the authenticated user's sheet configuration from
 * `user_settings`. When a `sheets_url` is present it fetches and parses
 * the CSV export; otherwise it returns an empty array and sets
 * `isSheetConfigured` to false so the UI can prompt the user to configure
 * their sheet in Settings.
 */
export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetConfigured, setIsSheetConfigured] = useState(false);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select(
          'sheets_url, sheets_col_date, sheets_col_price, sheets_col_amount, sheets_col_spent',
        )
        .eq('user_id', user.id)
        .single();

      if (settingsError) {
        throw settingsError;
      }

      if (!settingsData?.sheets_url) {
        setIsSheetConfigured(false);
        setPurchases([]);
        return;
      }

      setIsSheetConfigured(true);

      const config: SheetColumnConfig = {
        sheetsUrl: settingsData.sheets_url,
        colDate: settingsData.sheets_col_date ?? 'A',
        colPrice: settingsData.sheets_col_price ?? 'B',
        colAmount: settingsData.sheets_col_amount ?? 'C',
        colSpent: settingsData.sheets_col_spent ?? 'D',
      };

      const data = await fetchSheetPurchases(config, user.id);
      setPurchases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return {
    purchases,
    loading,
    error,
    isSheetConfigured,
    refresh: fetchPurchases,
  };
};
