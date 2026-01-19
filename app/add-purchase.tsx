import { usePurchases } from '../hooks/usePurchases';
import { PurchaseForm, PurchaseFormValues } from '../components/PurchaseForm';
import { parseNormalizedNumber } from '../lib/number-utils';

/**
 * Screen for adding a new Bitcoin purchase
 */
export default function AddPurchaseScreen() {
  const { addPurchase } = usePurchases();

  const handleSubmit = async (values: PurchaseFormValues) => {
    await addPurchase({
      purchase_date: values.purchase_date,
      btc_price_at_purchase: parseNormalizedNumber(values.btc_price_at_purchase),
      btc_amount: parseNormalizedNumber(values.btc_amount),
      usd_spent: parseNormalizedNumber(values.usd_spent),
    });
  };

  return (
    <PurchaseForm
      onSubmit={handleSubmit}
      submitButtonText="Add Purchase"
    />
  );
}
