import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { usePurchases } from '../hooks/usePurchases';
import { PurchaseForm, PurchaseFormValues } from '../components/PurchaseForm';
import { formatDateForInput } from '../lib/calculations';
import { parseNormalizedNumber } from '../lib/number-utils';

/**
 * Screen for editing an existing Bitcoin purchase
 */
export default function EditPurchaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases, updatePurchase, loading: purchasesLoading } = usePurchases();
  const [defaultValues, setDefaultValues] = useState<Partial<PurchaseFormValues>>();

  // Load purchase data
  useEffect(() => {
    if (!id || purchasesLoading) return;
    
    const purchase = purchases.find(p => p.id === id);
    if (purchase) {
      setDefaultValues({
        purchase_date: formatDateForInput(new Date(purchase.purchase_date)),
        btc_price_at_purchase: purchase.btc_price_at_purchase.toString(),
        btc_amount: purchase.btc_amount.toString(),
        usd_spent: purchase.usd_spent.toString(),
      });
    }
  }, [id, purchases, purchasesLoading]);

  const handleSubmit = async (values: PurchaseFormValues) => {
    if (!id) return;
    
    await updatePurchase(id, {
      purchase_date: values.purchase_date,
      btc_price_at_purchase: parseNormalizedNumber(values.btc_price_at_purchase),
      btc_amount: parseNormalizedNumber(values.btc_amount),
      usd_spent: parseNormalizedNumber(values.usd_spent),
    });
  };

  if (purchasesLoading || !defaultValues) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#F7931A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PurchaseForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitButtonText="Update Purchase"
      loading={purchasesLoading}
    />
  );
}
