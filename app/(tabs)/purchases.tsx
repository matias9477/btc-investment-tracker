import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePurchases } from '../../hooks/usePurchases';
import { PurchaseListItem } from '../../components/PurchaseListItem';

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
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#F7931A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.container}>
      {purchases.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>📝</Text>
          <Text style={styles.emptyStateTitle}>No Purchases Yet</Text>
          <Text style={styles.emptyStateText}>
            Add your first Bitcoin purchase to start tracking your investments
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddPurchase}>
            <Text style={styles.emptyStateButtonText}>Add First Purchase</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PurchaseListItem purchase={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Purchase History</Text>
              <Text style={styles.headerSubtitle}>{purchases.length} purchases</Text>
            </View>
          )}
        />
      )}

      {/* Floating Add Button */}
      {purchases.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddPurchase}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#F7931A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F7931A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
});
