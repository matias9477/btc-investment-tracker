import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases } from '../../hooks/usePurchases';
import { PurchaseTable } from '../../components/PurchaseTable';

/**
 * Screen displaying the full list of purchases fetched from Google Sheets.
 * When no sheet is configured, prompts the user to set one up in Settings.
 */
export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases, loading, isSheetConfigured, refresh } = usePurchases();

  const handleGoToSettings = () => {
    router.push('/(tabs)/settings');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#F7931A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor="#F7931A"
            />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Transactions</Text>
              <Text style={styles.headerSubtitle}>{purchases.length} total entries</Text>
            </View>
          </View>

          {!isSheetConfigured ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={80} color="#333" />
              </View>
              <Text style={styles.emptyStateTitle}>No Sheet Connected</Text>
              <Text style={styles.emptyStateText}>
                Connect a Google Sheet in Settings to load your purchase history automatically.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleGoToSettings}
                accessibilityLabel="Go to Settings to configure Google Sheet"
                accessibilityRole="button"
              >
                <Text style={styles.emptyStateButtonText}>Go to Settings</Text>
              </TouchableOpacity>
            </View>
          ) : purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={80} color="#333" />
              </View>
              <Text style={styles.emptyStateTitle}>No Data Found</Text>
              <Text style={styles.emptyStateText}>
                Your sheet appears to be empty or the column mapping doesn't match any
                rows with numeric data. Check your configuration in Settings.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleGoToSettings}
                accessibilityLabel="Go to Settings to update column mapping"
                accessibilityRole="button"
              >
                <Text style={styles.emptyStateButtonText}>Check Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <PurchaseTable purchases={purchases} />
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  tableContainer: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#F7931A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
