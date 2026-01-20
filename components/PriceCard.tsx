import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatUSD, formatPercentage } from '../lib/calculations';

interface PriceCardProps {
  price: number;
  priceChange24h?: number | null;
  fetchedAt?: Date;
}

/**
 * Sleek card for displaying the current Bitcoin price with 24h change
 */
export const PriceCard = ({ price, priceChange24h, fetchedAt }: PriceCardProps) => {
  const isPositive = priceChange24h ? priceChange24h >= 0 : true;

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="logo-bitcoin" size={24} color="#F7931A" />
        </View>
        <View>
          <Text style={styles.label}>Bitcoin Price</Text>
          <View style={styles.liveContainer}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>
      <View style={styles.rightContent}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatUSD(price)}</Text>
          {priceChange24h !== null && priceChange24h !== undefined && (
            <View style={[styles.changeBadge, isPositive ? styles.positiveChange : styles.negativeChange]}>
              <Ionicons 
                name={isPositive ? 'caret-up' : 'caret-down'} 
                size={10} 
                color={isPositive ? '#10B981' : '#EF4444'} 
              />
              <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
                {Math.abs(priceChange24h).toFixed(2)}%
              </Text>
            </View>
          )}
        </View>
        {fetchedAt && (
          <Text style={styles.time}>
            Last updated: {fetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(247, 147, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: 'bold',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  positiveChange: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  negativeChange: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  positiveText: {
    color: '#10B981',
  },
  negativeText: {
    color: '#EF4444',
  },
  time: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
  },
});
