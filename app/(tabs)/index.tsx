import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePurchases } from '../../hooks/usePurchases';
import { useSettings } from '../../hooks/useSettings';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { DashboardCard } from '../../components/DashboardCard';
import { PortfolioHero } from '../../components/PortfolioHero';
import { PriceCard } from '../../components/PriceCard';
import { calculateDashboardMetrics, formatUSD, formatBTC, formatPercentage, formatDateShort } from '../../lib/calculations';

/**
 * Dashboard screen showing all investment metrics
 */
export default function DashboardScreen() {
  const router = useRouter();
  const {
    purchases,
    sheetBtcBalance,
    loading: purchasesLoading,
    isSheetConfigured,
    refresh: refreshPurchases,
  } = usePurchases();
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

  // When the user configured a spreadsheet cell for their BTC balance, prefer
  // that value over the manually entered one (cell reference wins when present).
  const effectiveSettings = settings
    ? { ...settings, manual_btc_balance: sheetBtcBalance ?? settings.manual_btc_balance }
    : null;

  const metrics = calculateDashboardMetrics(purchases, effectiveSettings, price);
  const hasManualBalance = metrics.manualTotalBitcoin !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Welcome back</Text>
            <Text style={styles.headerTitle}>Portfolio</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F7931A"
            colors={['#F7931A']}
          />
        }
      >
        <View style={styles.content}>
          {/* Empty State — no sheet configured yet */}
          {!isSheetConfigured || purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconGlow}>
                <LinearGradient
                  colors={['#F7931A', '#FFAB40']}
                  style={styles.emptyIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="document-text" size={48} color="#FFF" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyStateTitle}>
                {!isSheetConfigured ? 'Connect Your Data' : 'No Data Found'}
              </Text>
              <Text style={styles.emptyStateText}>
                {!isSheetConfigured
                  ? 'Link your Google Sheet to automatically sync your Bitcoin purchases and track your portfolio.'
                  : 'Your sheet appears to be empty or the column mapping is incorrect. Check your configuration.'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/settings')}
                accessibilityLabel="Go to Settings to configure Google Sheet"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={['#F7931A', '#E87D0D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyStateButton}
                >
                  <Text style={styles.emptyStateButtonText}>Go to Settings</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 8 }} />
                </LinearGradient>
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

              {/* ── Investment Section ─────────────────────────────── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Investment</Text>
              </View>

              {/* Total Invested — always full-width, most prominent number */}
              <DashboardCard
                title="Total Invested"
                value={formatUSD(metrics.totalInvestment)}
                explanation="Total USD spent across all your recorded Bitcoin purchases."
              />

              {/* Value row */}
              <View style={styles.grid}>
                <DashboardCard
                  title={hasManualBalance ? 'Value (Purchases)' : 'Current Value'}
                  value={formatUSD(metrics.finalValuePurchased)}
                  compact
                  explanation="Current market value of the BTC you purchased."
                />
                {hasManualBalance && (
                  <DashboardCard
                    title="Value (Wallet)"
                    value={formatUSD(metrics.finalValueReal)}
                    compact
                    explanation="Current market value of your actual wallet balance, including yield."
                  />
                )}
              </View>

              {/* Profit row */}
              <View style={styles.grid}>
                <DashboardCard
                  title={hasManualBalance ? 'Profit (Purchases)' : 'Profit / Loss'}
                  value={formatUSD(metrics.profitPurchased)}
                  positive={metrics.profitPurchased > 0}
                  negative={metrics.profitPurchased < 0}
                  compact
                  explanation="Profit or loss based only on your recorded transactions."
                />
                {hasManualBalance ? (
                  <DashboardCard
                    title="Profit (Wallet)"
                    value={formatUSD(metrics.profitReal)}
                    positive={metrics.profitReal > 0}
                    negative={metrics.profitReal < 0}
                    compact
                    explanation="Total net profit including any interest or yield in your wallet."
                  />
                ) : (
                  <DashboardCard
                    title="ROI"
                    value={formatPercentage(metrics.roiPurchased)}
                    positive={metrics.roiPurchased > 0}
                    negative={metrics.roiPurchased < 0}
                    compact
                    explanation="Return on investment based on your recorded purchases."
                  />
                )}
              </View>

              {/* Break-even — full-width in no-interest mode */}
              {!hasManualBalance && (
                <DashboardCard
                  title="Break-even Price"
                  value={formatUSD(metrics.equilibriumPrice)}
                  explanation="The BTC price at which your portfolio has zero profit/loss. Total Invested ÷ BTC Purchased."
                />
              )}

              {/* ── Bitcoin Holdings Section ───────────────────────── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bitcoin Holdings</Text>
              </View>

              <View style={styles.grid}>
                <DashboardCard
                  title="BTC Purchased"
                  value={formatBTC(metrics.totalBoughtBitcoin)}
                  compact
                  explanation="Total Bitcoin accumulated across all your purchases."
                />
                {hasManualBalance ? (
                  <DashboardCard
                    title="BTC in Wallet"
                    value={formatBTC(metrics.manualTotalBitcoin!)}
                    compact
                    explanation="Your actual wallet balance, including all earned yield."
                  />
                ) : (
                  // No manual balance — show a useful second stat instead of an empty hole
                  <DashboardCard
                    title="Avg. Buy Price"
                    value={formatUSD(metrics.equilibriumPrice)}
                    compact
                    explanation="Your average purchase price per BTC (same as break-even). Total Invested ÷ BTC Purchased."
                  />
                )}
              </View>

              {/* ── Yield Section — only visible when a wallet balance is set ── */}
              {hasManualBalance && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Yield</Text>
                  </View>
                  <View style={styles.grid}>
                    <DashboardCard
                      title="Yield in BTC"
                      value={formatBTC(metrics.interestInBtc)}
                      positive={metrics.interestInBtc > 0}
                      negative={metrics.interestInBtc < 0}
                      compact
                      explanation="BTC earned through interest or yield: wallet balance minus total purchases."
                    />
                    <DashboardCard
                      title="Yield in USD"
                      value={formatUSD(metrics.interestInUsd)}
                      positive={metrics.interestInUsd > 0}
                      negative={metrics.interestInUsd < 0}
                      compact
                      explanation="Current market value of your earned BTC yield."
                    />
                  </View>

                  {/* ── Performance — only with interest, to compare both ROIs ── */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Performance</Text>
                  </View>
                  <View style={styles.grid}>
                    <DashboardCard
                      title="ROI (Purchases)"
                      value={formatPercentage(metrics.roiPurchased)}
                      positive={metrics.roiPurchased > 0}
                      negative={metrics.roiPurchased < 0}
                      compact
                      explanation="Return on investment based only on your purchase transactions."
                    />
                    <DashboardCard
                      title="ROI (Wallet)"
                      value={formatPercentage(metrics.roiReal)}
                      positive={metrics.roiReal > 0}
                      negative={metrics.roiReal < 0}
                      compact
                      explanation="Total ROI including earned yield in your wallet."
                    />
                  </View>
                  <DashboardCard
                    title="Break-even Price"
                    value={formatUSD(metrics.equilibriumPrice)}
                    explanation="The BTC price at which your purchases break even. Total Invested ÷ BTC Purchased."
                  />
                </>
              )}

              {/* Recent Activity */}
              {recentPurchases.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => router.push('/purchases')}>
                      <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.recentList}>
                    {recentPurchases.map((purchase, index) => (
                      <View 
                        key={purchase.id} 
                        style={[
                          styles.recentItem,
                          index === recentPurchases.length - 1 && styles.recentItemLast
                        ]}
                      >
                        <View style={styles.recentItemLeft}>
                          <View style={styles.recentIconContainer}>
                            <Ionicons name="arrow-down" size={16} color="#10B981" />
                          </View>
                          <View>
                            <Text style={styles.recentItemTitle}>Bought BTC</Text>
                            <Text style={styles.recentItemDate}>{formatDateShort(purchase.purchase_date)}</Text>
                          </View>
                        </View>
                        <View style={styles.recentItemRight}>
                          <Text style={styles.recentItemAmount}>+{formatBTC(purchase.btc_amount)}</Text>
                          <Text style={styles.recentItemPrice}>{formatUSD(purchase.usd_spent)}</Text>
                        </View>
                      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  headerGreeting: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
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
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#F7931A',
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    marginTop: 16,
  },
  recentList: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentItemTitle: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  recentItemDate: {
    fontSize: 12,
    color: '#888',
  },
  recentItemRight: {
    alignItems: 'flex-end',
  },
  recentItemAmount: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 4,
  },
  recentItemPrice: {
    fontSize: 13,
    color: '#888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconGlow: {
    shadowColor: '#F7931A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  emptyStateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
