import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { fetchBitcoinPrice } from '../lib/bitcoin-api';
import { formatDateForStorage, formatDateForInput, parseDateFromInput } from '../lib/calculations';
import { parseNormalizedNumber } from '../lib/number-utils';

export type PurchaseFormValues = {
  purchase_date: string;
  btc_price_at_purchase: string;
  btc_amount: string;
  usd_spent: string;
};

interface PurchaseFormProps {
  defaultValues?: Partial<PurchaseFormValues>;
  onSubmit: (values: { purchase_date: string; btc_price_at_purchase: string; btc_amount: string; usd_spent: string }) => Promise<void>;
  submitButtonText: string;
  loading?: boolean;
}

/**
 * Formats date input automatically: DD/MM/YYYY
 * Adds slashes automatically and prevents deleting them
 */
const formatDateInput = (value: string): string => {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limit to 8 digits (DDMMYYYY)
  const limited = digitsOnly.slice(0, 8);
  
  // Format as DD/MM/YYYY
  let formatted = '';
  if (limited.length > 0) {
    formatted = limited.slice(0, 2);
    if (limited.length > 2) {
      formatted += '/' + limited.slice(2, 4);
      if (limited.length > 4) {
        formatted += '/' + limited.slice(4, 8);
      }
    }
  }
  
  return formatted;
};

/**
 * Shared purchase form component for both add and edit
 */
export function PurchaseForm({ defaultValues, onSubmit, submitButtonText, loading: externalLoading }: PurchaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [lastFetchedPrice, setLastFetchedPrice] = useState<number | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isValid, isDirty },
  } = useForm<PurchaseFormValues>({
    defaultValues: {
      purchase_date: defaultValues?.purchase_date || formatDateForInput(new Date()),
      btc_price_at_purchase: defaultValues?.btc_price_at_purchase || '',
      btc_amount: defaultValues?.btc_amount || '',
      usd_spent: defaultValues?.usd_spent || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  /**
   * Fetches current Bitcoin price with rate limiting (1 minute cooldown)
   */
  const handleUseCurrentPrice = async () => {
    const now = Date.now();
    const oneMinute = 60 * 1000; // 1 minute in milliseconds

    // If we have a cached price and it's been less than 1 minute, use cached value
    if (lastFetchedPrice !== null && lastFetchedTime !== null && (now - lastFetchedTime) < oneMinute) {
      const priceStr = lastFetchedPrice.toString();
      setValue('btc_price_at_purchase', priceStr);
      clearErrors('btc_price_at_purchase');
      return;
    }

    setFetchingPrice(true);
    try {
      const currentPrice = await fetchBitcoinPrice();
      const priceStr = currentPrice.toString();
      setValue('btc_price_at_purchase', priceStr);
      clearErrors('btc_price_at_purchase');
      // Cache the price and timestamp
      setLastFetchedPrice(currentPrice);
      setLastFetchedTime(now);
    } catch (error) {
      // Error will be shown via form validation
    } finally {
      setFetchingPrice(false);
    }
  };

  /**
   * Handles form submission - only called if validation passes
   */
  const handleFormSubmit = async (values: PurchaseFormValues) => {
    if (loading || externalLoading) return;

    // Double-check date validation (in case Zod validation passed but date is still invalid)
    const purchaseDate = parseDateFromInput(values.purchase_date);
    if (!purchaseDate) {
      setError('purchase_date', {
        type: 'manual',
        message: 'Please enter a valid date in DD/MM/YYYY format (day: 1-31, month: 1-12, year: not in the future)',
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        purchase_date: formatDateForStorage(purchaseDate),
        btc_price_at_purchase: values.btc_price_at_purchase,
        btc_amount: values.btc_amount,
        usd_spent: values.usd_spent,
      });
      router.back();
    } catch (error: any) {
      console.error('Failed to submit purchase:', error);
      // If there's a validation error from Zod, it should already be in errors state
      // But if there's another error, we could set it here
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading || false;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Date */}
            <Text style={styles.label}>Purchase Date (DD/MM/YYYY)</Text>
            <Controller
              control={control}
              name="purchase_date"
              rules={{
                required: 'Date is required',
                validate: (val) => {
                  const date = parseDateFromInput(val);
                  if (!date) {
                    return 'Please enter a valid date in DD/MM/YYYY format';
                  }
                  
                  // Additional validation: check if format is complete DD/MM/YYYY
                  const parts = val.split('/');
                  if (parts.length !== 3) {
                    return 'Please enter a valid date in DD/MM/YYYY format';
                  }
                  
                  const day = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10);
                  const year = parseInt(parts[2], 10);
                  
                  // Validate day (1-31)
                  if (day < 1 || day > 31) {
                    return 'Day must be between 1 and 31';
                  }
                  
                  // Validate month (1-12)
                  if (month < 1 || month > 12) {
                    return 'Month must be between 1 and 12';
                  }
                  
                  // Validate year (not future)
                  const currentYear = new Date().getFullYear();
                  if (year > currentYear) {
                    return 'Year cannot be in the future';
                  }
                  
                  return true;
                },
              }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                const handleDateChange = (text: string) => {
                  const formatted = formatDateInput(text);
                  onChange(formatted);
                };

                const handleBlur = () => {
                  onBlur();
                };

                return (
                  <>
                    <TextInput
                      style={[styles.input, error && styles.inputError]}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={handleDateChange}
                      onBlur={handleBlur}
                      keyboardType="numeric"
                      editable={!isLoading}
                      maxLength={10} // DD/MM/YYYY = 10 characters
                    />
                    {error && (
                      <Text style={styles.errorText}>
                        {error.message}
                      </Text>
                    )}
                  </>
                );
              }}
            />
            <Text style={styles.hint}>
              Enter date in DD/MM/YYYY format (e.g., 25/12/2023)
            </Text>

            {/* BTC Price */}
            <Text style={styles.label}>Bitcoin Price (USD)</Text>
            <View style={styles.priceRow}>
              <Controller
                control={control}
                name="btc_price_at_purchase"
                rules={{
                  required: 'Bitcoin price is required',
                  validate: (val) => {
                    const num = parseNormalizedNumber(val);
                    if (isNaN(num) || num <= 0) {
                      return 'Please enter a valid Bitcoin price';
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                  const handleBlur = () => {
                    onBlur();
                  };

                  return (
                    <>
                      <TextInput
                        style={[
                          styles.input,
                          styles.priceInput,
                          error && styles.inputError,
                        ]}
                        placeholder="0.00"
                        placeholderTextColor="#666"
                        value={value}
                        onChangeText={onChange}
                        onBlur={handleBlur}
                        keyboardType="numeric"
                        editable={!isLoading && !fetchingPrice}
                      />
                      {error && (
                        <Text style={styles.errorText}>{error.message}</Text>
                      )}
                    </>
                  );
                }}
              />
              <TouchableOpacity
                style={styles.currentPriceButton}
                onPress={handleUseCurrentPrice}
                disabled={isLoading || fetchingPrice}
              >
                {fetchingPrice ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.currentPriceButtonText}>Use Current</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* BTC Amount */}
            <Text style={styles.label}>Bitcoin Amount</Text>
            <Controller
              control={control}
              name="btc_amount"
              rules={{
                required: 'Bitcoin amount is required',
                validate: (val) => {
                  const num = parseNormalizedNumber(val);
                  if (isNaN(num) || num <= 0) {
                    return 'Please enter a valid Bitcoin amount';
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                const handleBlur = () => {
                  onBlur();
                };

                return (
                  <>
                    <TextInput
                      style={[styles.input, error && styles.inputError]}
                      placeholder="0.00000000"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      onBlur={handleBlur}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                    {error && (
                      <Text style={styles.errorText}>{error.message}</Text>
                    )}
                  </>
                );
              }}
            />
            <Text style={styles.hint}>
              Enter amount with high precision (e.g., 0.00645778 or 0,00645778)
            </Text>

            {/* USD Spent */}
            <Text style={styles.label}>USD Spent</Text>
            <Controller
              control={control}
              name="usd_spent"
              rules={{
                required: 'USD spent is required',
                validate: (val) => {
                  const num = parseNormalizedNumber(val);
                  if (isNaN(num) || num <= 0) {
                    return 'Please enter a valid USD amount';
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
                const handleBlur = () => {
                  onBlur();
                };

                return (
                  <>
                    <TextInput
                      style={[styles.input, error && styles.inputError]}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      value={value}
                      onChangeText={onChange}
                      onBlur={handleBlur}
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                    {error && (
                      <Text style={styles.errorText}>{error.message}</Text>
                    )}
                  </>
                );
              }}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoading || !isValid) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(handleFormSubmit)}
              disabled={isLoading || !isValid}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.submitButtonText}>{submitButtonText}</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  currentPriceButton: {
    backgroundColor: '#F7931A',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    minWidth: 100,
    alignItems: 'center',
  },
  currentPriceButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#F7931A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
  },
});
