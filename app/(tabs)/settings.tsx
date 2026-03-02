import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { formatDate } from '../../lib/calculations';

/** Validates that a column value is one or two uppercase letters (e.g. 'A', 'AB'). */
const isValidColumn = (val: string): boolean => /^[A-Za-z]{1,2}$/.test(val.trim());

/**
 * Settings screen for managing user preferences, manual balance,
 * and Google Sheets data source configuration.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { settings, loading, updateSettings } = useSettings();

  const [manualBalance, setManualBalance] = useState(
    settings?.manual_btc_balance?.toString() ?? '',
  );
  /** 'manual' → numeric text input; 'cell' → spreadsheet cell reference input */
  const [balanceMode, setBalanceMode] = useState<'manual' | 'cell'>(
    settings?.manual_btc_balance_cell ? 'cell' : 'manual',
  );
  const [cellRef, setCellRef] = useState(settings?.manual_btc_balance_cell ?? '');
  const [savingBalance, setSavingBalance] = useState(false);

  // Google Sheets state
  const [sheetsUrl, setSheetsUrl] = useState(settings?.sheets_url ?? '');
  const [colDate, setColDate] = useState(settings?.sheets_col_date ?? 'A');
  const [colPrice, setColPrice] = useState(settings?.sheets_col_price ?? 'B');
  const [colAmount, setColAmount] = useState(settings?.sheets_col_amount ?? 'C');
  const [colSpent, setColSpent] = useState(settings?.sheets_col_spent ?? 'D');
  const [savingSheet, setSavingSheet] = useState(false);

  // Sync local state when settings load from Supabase
  useEffect(() => {
    if (!settings) return;
    setManualBalance(settings.manual_btc_balance?.toString() ?? '');
    const hasCellRef = !!settings.manual_btc_balance_cell;
    setBalanceMode(hasCellRef ? 'cell' : 'manual');
    setCellRef(settings.manual_btc_balance_cell ?? '');
    setSheetsUrl(settings.sheets_url ?? '');
    setColDate(settings.sheets_col_date ?? 'A');
    setColPrice(settings.sheets_col_price ?? 'B');
    setColAmount(settings.sheets_col_amount ?? 'C');
    setColSpent(settings.sheets_col_spent ?? 'D');
  }, [settings]);

  /**
   * Saves the BTC balance configuration. Behaviour differs by mode:
   * - 'manual': validates and saves the numeric value, clears any cell reference.
   * - 'cell': validates the cell reference format, saves it, clears the numeric value.
   *
   * Setting both fields as mutually exclusive keeps the priority logic
   * in the dashboard simple — cell reference always wins when present.
   */
  const handleSaveBalance = async () => {
    if (balanceMode === 'cell') {
      const trimmed = cellRef.trim().toUpperCase();
      if (!trimmed || !/^[A-Z]{1,2}\d+$/.test(trimmed)) {
        Alert.alert(
          'Invalid Cell Reference',
          'Enter a valid cell reference like "I7" or "AB12".',
        );
        return;
      }

      setSavingBalance(true);
      try {
        await updateSettings({
          manual_btc_balance_cell: trimmed,
          manual_btc_balance: null,
          manual_balance_updated_at: new Date().toISOString(),
        });
        Alert.alert(
          'Saved',
          `Cell reference "${trimmed}" saved. Your balance will be read from that cell on each sync.`,
        );
      } catch {
        Alert.alert('Error', 'Failed to save cell reference');
      } finally {
        setSavingBalance(false);
      }
      return;
    }

    if (!manualBalance) {
      Alert.alert('Error', 'Please enter your current Bitcoin balance');
      return;
    }

    const balance = parseFloat(manualBalance);
    if (isNaN(balance) || balance < 0) {
      Alert.alert('Error', 'Please enter a valid Bitcoin amount');
      return;
    }

    setSavingBalance(true);
    try {
      await updateSettings({
        manual_btc_balance: balance,
        manual_btc_balance_cell: null,
        manual_balance_updated_at: new Date().toISOString(),
      });
      Alert.alert('Success', 'Manual balance updated');
    } catch {
      Alert.alert('Error', 'Failed to update manual balance');
    } finally {
      setSavingBalance(false);
    }
  };

  const handleSaveSheetConfig = async () => {
    if (!sheetsUrl.trim()) {
      Alert.alert('Error', 'Please enter your Google Sheets URL');
      return;
    }

    if (!sheetsUrl.includes('docs.google.com/spreadsheets')) {
      Alert.alert(
        'Invalid URL',
        'Please paste the full Google Sheets sharing URL (e.g. https://docs.google.com/spreadsheets/d/…)',
      );
      return;
    }

    const invalidCols = [
      { label: 'Date', val: colDate },
      { label: 'BTC Price', val: colPrice },
      { label: 'BTC Amount', val: colAmount },
      { label: 'USD Spent', val: colSpent },
    ].filter((c) => !isValidColumn(c.val));

    if (invalidCols.length > 0) {
      Alert.alert(
        'Invalid Column',
        `Column for "${invalidCols[0].label}" must be a letter (A–Z or AA–ZZ).`,
      );
      return;
    }

    setSavingSheet(true);
    try {
      await updateSettings({
        sheets_url: sheetsUrl.trim(),
        sheets_col_date: colDate.toUpperCase().trim(),
        sheets_col_price: colPrice.toUpperCase().trim(),
        sheets_col_amount: colAmount.toUpperCase().trim(),
        sheets_col_spent: colSpent.toUpperCase().trim(),
      });
      Alert.alert('Saved', 'Google Sheets configuration saved. Pull to refresh on Dashboard or Purchases to load your data.');
    } catch {
      Alert.alert('Error', 'Failed to save Google Sheets configuration');
    } finally {
      setSavingSheet(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#F7931A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Settings</Text>

          {/* Google Sheets Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Google Sheets Data Source</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Connect a Google Sheet that contains your purchase history. The sheet
              must be set to "Anyone with the link can view". Rows without numeric
              values in the price/amount/spent columns are automatically ignored.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Spreadsheet URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                placeholderTextColor="#555"
                value={sheetsUrl}
                onChangeText={setSheetsUrl}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!savingSheet}
              />
            </View>

            <Text style={styles.columnSectionLabel}>Column Mapping</Text>
            <Text style={styles.sectionDescription}>
              Enter the column letter (A, B, C…) for each field in your sheet.
            </Text>

            <View style={styles.columnGrid}>
              <View style={styles.columnItem}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.columnInput}
                  value={colDate}
                  onChangeText={(v) => setColDate(v.toUpperCase())}
                  maxLength={2}
                  autoCapitalize="characters"
                  editable={!savingSheet}
                  accessibilityLabel="Date column"
                />
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.inputLabel}>BTC Price</Text>
                <TextInput
                  style={styles.columnInput}
                  value={colPrice}
                  onChangeText={(v) => setColPrice(v.toUpperCase())}
                  maxLength={2}
                  autoCapitalize="characters"
                  editable={!savingSheet}
                  accessibilityLabel="BTC Price column"
                />
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.inputLabel}>BTC Amount</Text>
                <TextInput
                  style={styles.columnInput}
                  value={colAmount}
                  onChangeText={(v) => setColAmount(v.toUpperCase())}
                  maxLength={2}
                  autoCapitalize="characters"
                  editable={!savingSheet}
                  accessibilityLabel="BTC Amount column"
                />
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.inputLabel}>USD Spent</Text>
                <TextInput
                  style={styles.columnInput}
                  value={colSpent}
                  onChangeText={(v) => setColSpent(v.toUpperCase())}
                  maxLength={2}
                  autoCapitalize="characters"
                  editable={!savingSheet}
                  accessibilityLabel="USD Spent column"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, savingSheet && styles.buttonDisabled]}
              onPress={handleSaveSheetConfig}
              disabled={savingSheet}
              accessibilityLabel="Save Google Sheets configuration"
              accessibilityRole="button"
            >
              {savingSheet ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.buttonText}>Save Sheet Configuration</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bitcoin Balance</Text>
            </View>

            <Text style={styles.sectionDescription}>
              Configure how the app determines your total BTC balance. Enter a
              value manually or let it read directly from a cell in your spreadsheet.
            </Text>

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeOption, balanceMode === 'manual' && styles.modeOptionActive]}
                onPress={() => setBalanceMode('manual')}
                accessibilityLabel="Enter balance manually"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    balanceMode === 'manual' && styles.modeOptionTextActive,
                  ]}
                >
                  Enter manually
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeOption, balanceMode === 'cell' && styles.modeOptionActive]}
                onPress={() => setBalanceMode('cell')}
                accessibilityLabel="Read balance from spreadsheet cell"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    balanceMode === 'cell' && styles.modeOptionTextActive,
                  ]}
                >
                  From sheet cell
                </Text>
              </TouchableOpacity>
            </View>

            {settings?.manual_balance_updated_at && (
              <Text style={styles.lastUpdated}>
                Last updated: {formatDate(settings.manual_balance_updated_at)}
              </Text>
            )}

            {balanceMode === 'manual' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current BTC Balance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00000000"
                  placeholderTextColor="#666"
                  value={manualBalance}
                  onChangeText={setManualBalance}
                  keyboardType="decimal-pad"
                  editable={!savingBalance}
                  accessibilityLabel="Current BTC balance"
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cell Reference</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. I7"
                  placeholderTextColor="#666"
                  value={cellRef}
                  onChangeText={(v) => setCellRef(v.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  editable={!savingBalance}
                  accessibilityLabel="Cell reference for BTC balance"
                />
                <Text style={styles.cellRefHint}>
                  The cell that contains your total BTC balance (e.g. "I7"). Its
                  value is read automatically on every sheet sync.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, savingBalance && styles.buttonDisabled]}
              onPress={handleSaveBalance}
              disabled={savingBalance}
              accessibilityLabel="Save balance configuration"
              accessibilityRole="button"
            >
              {savingBalance ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.buttonText}>
                  {balanceMode === 'manual' ? 'Update Balance' : 'Save Cell Reference'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* App Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>App Info</Text>
            </View>
            <Text style={styles.appInfo}>BTC Investment Tracker v1.0.0</Text>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  columnSectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#CCC',
    marginBottom: 6,
    marginTop: 4,
  },
  columnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  columnItem: {
    flex: 1,
    minWidth: '40%',
  },
  columnInput: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: '#F7931A',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  inputGroup: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#FFF',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F7931A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeOptionActive: {
    backgroundColor: '#F7931A',
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeOptionTextActive: {
    color: '#000',
  },
  cellRefHint: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 4,
  },
  appInfo: {
    fontSize: 14,
    color: '#999',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  signOutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
