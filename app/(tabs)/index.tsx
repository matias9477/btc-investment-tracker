import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePurchases } from '../../hooks/usePurchases';
import { useSettings } from '../../hooks/useSettings';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { DashboardCard } from '../../components/DashboardCard';
import { PortfolioHero } from '../../components/PortfolioHero';
import { PriceCard } from '../../components/PriceCard';
import { calculateDashboardMetrics, formatUSD, formatBTC, formatPercentage, formatDate, formatDateShort } from '../../lib/calculations';

/**
 * Dashboard screen showing all investment metrics
 */
export default function DashboardScreen() {
  const router = useRouter();
  const { purchases, loading: purchasesLoading, refresh: refreshPurchases } = usePurchases();
  const { settings, loading: settingsLoading, refresh: refreshSettings } = useSettings();
  const { price, priceChange24h, loading: priceLoading, fetchedAt, refresh: refreshPrice } = useBitcoinPrice();
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

  const recentPurchases = useMemo(() => {
    return [...purchases]
      .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
      .slice(0, 3);
  }, [purchases]);

  if (purchasesLoading || settingsLoading || priceLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#F7931A" />
      </SafeAreaView>
    );
  }

  if (!price) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top']}>
        <Ionicons name="cloud-offline-outline" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>Failed to load Bitcoin price</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshPrice}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const metrics = calculateDashboardMetrics(purchases, settings, price);
  const hasManualBalance = metrics.manualTotalBitcoin !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
            <View>
              <Text style={styles.headerGreeting}>Welcome back</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.addIconButton} onPress={handleAddPurchase}>
              <Ionicons name="add" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="stats-chart" size={80} color="#333" />
              </View>
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
              {/* Portfolio Hero - Shows the REAL status (with interest if manual balance exists) */}
              <PortfolioHero 
                totalValue={metrics.finalValueReal}
                profit={metrics.profitReal}
                roi={metrics.roiReal}
                btcAmount={hasManualBalance ? metrics.manualTotalBitcoin! : metrics.totalBoughtBitcoin}
                title={hasManualBalance ? 'Real Wallet Balance' : 'Total Portfolio Balance'}
              />

              {/* BTC Price */}
              <PriceCard 
                price={metrics.currentBtcPrice} 
                priceChange24h={priceChange24h}
                fetchedAt={fetchedAt || undefined} 
              />

              {/* Basic Portfolio Stats */}
              <Text style={styles.sectionTitle}>Portfolio Summary</Text>
              <View style={styles.grid}>
                <DashboardCard
                  title="Total Invested"
                  value={formatUSD(metrics.totalInvestment)}
                  compact
                  explanation="Total USD spent across all your Bitcoin purchases."
                />
                <DashboardCard
                  title="Total BTC Bought"
                  value={formatBTC(metrics.totalBoughtBitcoin)}
                  compact
                  explanation="Total amount of Bitcoin you have purchased across all recorded transactions."
                />
              </View>

              {/* Interest / Gain Metrics - Only if manual balance exists */}
              {hasManualBalance && (
                <>
                  <Text style={styles.sectionTitle}>Interest & Yield</Text>
                  <View style={styles.grid}>
                    <DashboardCard
                      title="Yield Amount"
                      value={formatBTC(metrics.interestInBtc)}
                      positive={metrics.interestInBtc > 0}
                      negative={metrics.interestInBtc < 0}
                      compact
                      explanation="The difference in BTC between your wallet balance and your total purchases."
                    />
                    <DashboardCard
                      title="Yield Value"
                      value={formatUSD(metrics.interestInUsd)}
                      positive={metrics.interestInUsd > 0}
                      negative={metrics.interestInUsd < 0}
                      compact
                      explanation="The current market value of your earned interest/yield."
                    />
                    <DashboardCard
                      title="Base ROI"
                      value={formatPercentage(metrics.roiPurchased)}
                      positive={metrics.roiPurchased > 0}
                      negative={metrics.roiPurchased < 0}
                      compact
                      explanation="ROI based only on your purchases."
                    />
                    <DashboardCard
                      title="Net ROI"
                      value={formatPercentage(metrics.roiReal)}
                      positive={metrics.roiReal > 0}
                      negative={metrics.roiReal < 0}
                      compact
                      explanation="Total ROI including your yield/interest."
                    />
                  </View>
                </>
              )}

              {/* Performance Comparison */}
              <Text style={styles.sectionTitle}>Performance Analysis</Text>
              <View style={styles.grid}>
                <DashboardCard
                  title="Break-even"
                  value={formatUSD(metrics.equilibriumPrice)}
                  compact
                  explanation="The Bitcoin price needed for your portfolio to have zero profit/loss. Total Investment / Total BTC Purchased."
                />
                <View style={{ width: '45%', marginHorizontal: 4 }} /> 
                
                {/* Profit Row */}
                <DashboardCard
                  title="P/L (Purchased)"
                  value={formatUSD(metrics.profitPurchased)}
                  positive={metrics.profitPurchased > 0}
                  negative={metrics.profitPurchased < 0}
                  compact
                  explanation="Profit/loss based ONLY on your recorded transactions."
                />
                {hasManualBalance ? (
                  <DashboardCard
                    title="P/L (Real)"
                    value={formatUSD(metrics.profitReal)}
                    positive={metrics.profitReal > 0}
                    negative={metrics.profitReal < 0}
                    compact
                    explanation="Total net profit/loss, including any interest or external gains in your wallet."
                  />
                ) : (
                  <View style={{ width: '45%', marginHorizontal: 4 }} />
                )}

                {/* Value Row */}
                <DashboardCard
                  title="Value (Purchased)"
                  value={formatUSD(metrics.finalValuePurchased)}
                  compact
                  explanation="The current value of the total BTC you have purchased."
                />
                {hasManualBalance ? (
                  <DashboardCard
                    title="Value (Real)"
                    value={formatUSD(metrics.finalValueReal)}
                    compact
                    explanation="The current value of your actual wallet balance."
                  />
                ) : (
                  <View style={{ width: '45%', marginHorizontal: 4 }} />
                )}
              </View>

              {/* Recent Activity */}
              {recentPurchases.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => router.push('/purchases')}>
                      <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.recentTable}>
                    <View style={styles.recentTableHeader}>
                      <Text style={[styles.recentHeaderCell, { width: 65 }]}>Date</Text>
                      <Text style={[styles.recentHeaderCell, { flex: 1.2, paddingLeft: 4 }]}>Price</Text>
                      <Text style={[styles.recentHeaderCell, { flex: 1, textAlign: 'right' }]}>Spent</Text>
                    </View>
                    {recentPurchases.map((purchase) => (
                      <TouchableOpacity 
                        key={purchase.id} 
                        style={styles.recentRow}
                        onPress={() => router.push({
                          pathname: '/edit-purchase',
                          params: { id: purchase.id }
                        })}
                      >
                        <Text style={[styles.recentCell, { width: 65 }]}>{formatDateShort(purchase.purchase_date)}</Text>
                        <Text style={[styles.recentCell, { flex: 1.2, paddingLeft: 4 }]}>{formatUSD(purchase.btc_price_at_purchase)}</Text>
                        <Text style={[styles.recentCell, { flex: 1, textAlign: 'right' }]}>{formatUSD(purchase.usd_spent)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
            </>
          )}
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F7931A',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerGreeting: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  seeAllText: {
    color: '#F7931A',
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 12,
  },
  recentTable: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
    marginTop: 4,
  },
  recentTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  recentHeaderCell: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  recentCell: {
    fontSize: 13,
    color: '#FFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
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
