import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Purchase } from '../types/database';

/**
 * Custom hook to manage purchases data from Supabase
 */
export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (fetchError) throw fetchError;

      setPurchases(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('purchases')
        .insert([{ ...purchase, user_id: user.id }]);

      if (insertError) throw insertError;

      await fetchPurchases();
    } catch (err) {
      throw err;
    }
  };

  const updatePurchase = async (id: string, updates: Partial<Purchase>) => {
    try {
      const { error: updateError } = await supabase
        .from('purchases')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPurchases();
    } catch (err) {
      throw err;
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchPurchases();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return {
    purchases,
    loading,
    error,
    refresh: fetchPurchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
  };
};
