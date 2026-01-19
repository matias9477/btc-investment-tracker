import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePurchases } from '../../hooks/usePurchases';
import { useSettings } from '../../hooks/useSettings';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { DashboardCard } from '../../components/DashboardCard';
import { calculateDashboardMetrics, formatUSD, formatBTC, formatPercentage, formatDate } from '../../lib/calculations';

/**
 * Dashboard screen showing all investment metrics
 */
export default function DashboardScreen() {
  const router = useRouter();
  const { purchases, loading: purchasesLoading, refresh: refreshPurchases } = usePurchases();
  const { settings, loading: settingsLoading, refresh: refreshSettings } = useSettings();
  const { price, loading: priceLoading, fetchedAt, refresh: refreshPrice } = useBitcoinPrice();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshPurchases(),
      refreshSettings(),
      refreshPrice(),
    ]);
    setRefreshing(false);
  };

  const handleAddPurchase = () => {
    router.push('/add-purchase');
  };

  if (purchasesLoading || settingsLoading || priceLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#F7931A" />
      </SafeAreaView>
    );
  }

  if (!price) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>Failed to load Bitcoin price</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshPrice}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const metrics = calculateDashboardMetrics(purchases, settings, price);
  const showInterest = settings?.interest_enabled && metrics.manualTotalBitcoin !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F7931A"
          />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Portfolio</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddPurchase}>
              <Text style={styles.addButtonText}>+ Add Purchase</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📊</Text>
              <Text style={styles.emptyStateTitle}>No Purchases Yet</Text>
              <Text style={styles.emptyStateText}>
                Start tracking your Bitcoin investments by adding your first purchase
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddPurchase}>
                <Text style={styles.emptyStateButtonText}>Add First Purchase</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Current Price */}
              <DashboardCard
                title="Current BTC Price"
                value={formatUSD(metrics.currentBtcPrice)}
                subtitle={
                  fetchedAt
                    ? `Fetched ${formatDate(fetchedAt.toISOString())}`
                    : undefined
                }
              />

              {/* Investment Summary */}
              <Text style={styles.sectionTitle}>Investment Summary</Text>
              <DashboardCard
                title="Total Investment"
                value={formatUSD(metrics.totalInvestment)}
                subtitle="Total USD spent"
              />
              <DashboardCard
                title="Total Bought Bitcoin"
                value={formatBTC(metrics.totalBoughtBitcoin)}
              />

              {/* Manual Balance */}
              {metrics.manualTotalBitcoin !== null && (
                <DashboardCard
                  title="Real Total Bitcoin"
                  value={formatBTC(metrics.manualTotalBitcoin)}
                  subtitle={
                    metrics.manualBalanceUpdatedAt
                      ? `Updated ${formatDate(metrics.manualBalanceUpdatedAt)}`
                      : undefined
                  }
                />
              )}

              {/* Interest (if enabled and manual balance exists) */}
              {showInterest && (
                <>
                  <Text style={styles.sectionTitle}>Interest Earned</Text>
                  <DashboardCard
                    title="Interest in BTC"
                    value={formatBTC(metrics.interestInBtc)}
                    positive={metrics.interestInBtc > 0}
                  />
                  <DashboardCard
                    title="Interest in USD"
                    value={formatUSD(metrics.interestInUsd)}
                    positive={metrics.interestInUsd > 0}
                  />
                </>
              )}

              {/* Current Value & Profit */}
              <Text style={styles.sectionTitle}>Performance</Text>
              <DashboardCard
                title={showInterest ? 'Final Value (without interest)' : 'Final Value'}
                value={formatUSD(metrics.finalValueWithoutInterest)}
              />
              {showInterest && (
                <DashboardCard
                  title="Final Value (with interest)"
                  value={formatUSD(metrics.finalValueWithInterest)}
                />
              )}
              <DashboardCard
                title={showInterest ? 'Profit (without interest)' : 'Profit/Loss'}
                value={formatUSD(metrics.profitWithoutInterest)}
                positive={metrics.profitWithoutInterest > 0}
                negative={metrics.profitWithoutInterest < 0}
                subtitle={`ROI: ${formatPercentage(metrics.roiWithoutInterest)}`}
              />
              {showInterest && (
                <DashboardCard
                  title="Profit (with interest)"
                  value={formatUSD(metrics.profitWithInterest)}
                  positive={metrics.profitWithInterest > 0}
                  negative={metrics.profitWithInterest < 0}
                  subtitle={`ROI: ${formatPercentage(metrics.roiWithInterest)}`}
                />
              )}

              {/* Equilibrium Price */}
              <DashboardCard
                title="Equilibrium Price"
                value={formatUSD(metrics.equilibriumPrice)}
                subtitle="Break-even BTC price"
              />
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F7931A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#F7931A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    paddingHorizontal: 32,
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
});
