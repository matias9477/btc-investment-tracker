import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases } from '../../hooks/usePurchases';
import { PurchaseTable } from '../../components/PurchaseTable';

/**
 * Screen displaying list of all purchases with management options
 */
export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases, loading, deletePurchase } = usePurchases();

  const handleDelete = async (id: string) => {
    try {
      await deletePurchase(id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete purchase');
    }
  };

  const handleAddPurchase = () => {
    router.push('/add-purchase');
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Transactions</Text>
              <Text style={styles.headerSubtitle}>{purchases.length} total entries</Text>
            </View>
            <TouchableOpacity style={styles.addIconButton} onPress={handleAddPurchase}>
              <Ionicons name="add" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={80} color="#333" />
              </View>
              <Text style={styles.emptyStateTitle}>No Records Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first Bitcoin purchase to start tracking your history in this grid
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddPurchase}>
                <Text style={styles.emptyStateButtonText}>Add Purchase</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <PurchaseTable purchases={purchases} onDelete={handleDelete} />
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
  addIconButton: {
    backgroundColor: '#F7931A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#F7931A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
