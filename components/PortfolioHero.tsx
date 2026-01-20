import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatUSD, formatPercentage, formatBTC } from '../lib/calculations';

const { width } = Dimensions.get('window');

interface PortfolioHeroProps {
  totalValue: number;
  profit: number;
  roi: number;
  btcAmount: number;
  title?: string;
}

/**
 * Modern hero card with gradient for the main portfolio metrics
 * Displays total value, profit/loss, and ROI
 */
export const PortfolioHero = ({
  totalValue,
  profit,
  roi,
  btcAmount,
  title = 'Total Balance',
}: PortfolioHeroProps) => {
  const isPositive = profit >= 0;

  return (
    <LinearGradient
      colors={['#F7931A', '#FFAB40']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{formatUSD(totalValue)}</Text>
        </View>
        <View style={styles.btcBadge}>
          <Text style={styles.btcText}>{formatBTC(btcAmount)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.profitContainer}>
          <View style={[styles.trendBadge, isPositive ? styles.positiveBadge : styles.negativeBadge]}>
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={isPositive ? '#10B981' : '#EF4444'} 
            />
            <Text style={[styles.roiText, isPositive ? styles.positiveText : styles.negativeText]}>
              {formatPercentage(roi)}
            </Text>
          </View>
          <Text style={styles.profitValue}>
            {isPositive ? '+' : ''}{formatUSD(profit)}
          </Text>
        </View>
      </View>
      
      {/* Decorative background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#F7931A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  title: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  btcBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  btcText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    zIndex: 1,
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  positiveBadge: {
    backgroundColor: '#ECFDF5',
  },
  negativeBadge: {
    backgroundColor: '#FEF2F2',
  },
  roiText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positiveText: {
    color: '#10B981',
  },
  negativeText: {
    color: '#EF4444',
  },
  profitValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  circle1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle2: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
