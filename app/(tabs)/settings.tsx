import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { formatDate } from '../../lib/calculations';

/**
 * Settings screen for managing user preferences and manual balance
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { settings, loading, updateSettings } = useSettings();
  
  const [interestEnabled, setInterestEnabled] = useState(settings?.interest_enabled ?? false);
  const [annualRate, setAnnualRate] = useState(
    settings?.annual_interest_rate?.toString() ?? '7'
  );
  const [manualBalance, setManualBalance] = useState(
    settings?.manual_btc_balance?.toString() ?? ''
  );
  const [saving, setSaving] = useState(false);

  const handleToggleInterest = async (value: boolean) => {
    setInterestEnabled(value);
    try {
      await updateSettings({ interest_enabled: value });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update interest setting');
      setInterestEnabled(!value);
    }
  };

  const handleUpdateInterestRate = async () => {
    if (!annualRate) {
      Alert.alert('Error', 'Please enter an interest rate');
      return;
    }

    const rate = parseFloat(annualRate);
    if (isNaN(rate) || rate < 0) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({ annual_interest_rate: rate });
      Alert.alert('Success', 'Interest rate updated');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update interest rate');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateManualBalance = async () => {
    if (!manualBalance) {
      Alert.alert('Error', 'Please enter your current Bitcoin balance');
      return;
    }

    const balance = parseFloat(manualBalance);
    if (isNaN(balance) || balance < 0) {
      Alert.alert('Error', 'Please enter a valid Bitcoin amount');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        manual_btc_balance: balance,
        manual_balance_updated_at: new Date().toISOString(),
      });
      Alert.alert('Success', 'Manual balance updated');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update manual balance');
    } finally {
      setSaving(false);
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

        {/* Interest Tracking Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interest Tracking</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Interest</Text>
              <Text style={styles.settingDescription}>
                Track interest earned on your Bitcoin holdings
              </Text>
            </View>
            <Switch
              value={interestEnabled}
              onValueChange={handleToggleInterest}
              trackColor={{ false: '#333', true: '#F7931A80' }}
              thumbColor={interestEnabled ? '#F7931A' : '#999'}
            />
          </View>

          {interestEnabled && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Annual Interest Rate (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                placeholderTextColor="#666"
                value={annualRate}
                onChangeText={setAnnualRate}
                keyboardType="decimal-pad"
                editable={!saving}
              />
              <TouchableOpacity
                style={[styles.button, saving && styles.buttonDisabled]}
                onPress={handleUpdateInterestRate}
                disabled={saving}
              >
                <Text style={styles.buttonText}>Update Rate</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual Balance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manual Wallet Balance</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Enter your actual Bitcoin balance from your wallet. This helps track interest 
            and prevents calculation errors.
          </Text>

          {settings?.manual_balance_updated_at && (
            <Text style={styles.lastUpdated}>
              Last updated: {formatDate(settings.manual_balance_updated_at)}
            </Text>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current BTC Balance</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00000000"
              placeholderTextColor="#666"
              value={manualBalance}
              onChangeText={setManualBalance}
              keyboardType="decimal-pad"
              editable={!saving}
            />
            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleUpdateManualBalance}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.buttonText}>Update Balance</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App Info</Text>
          </View>
          <Text style={styles.appInfo}>BTC Investment Tracker v1.0.0</Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#F7931A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
