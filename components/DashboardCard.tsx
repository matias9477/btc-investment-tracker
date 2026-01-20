import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useToast } from './ToastProvider';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  positive?: boolean;
  negative?: boolean;
  compact?: boolean;
  explanation?: string;
}

/**
 * Reusable card component for displaying dashboard metrics
 */
export const DashboardCard = ({ 
  title, 
  value, 
  subtitle,
  positive = false,
  negative = false,
  compact = false,
  explanation,
}: DashboardCardProps) => {
  const { showToast } = useToast();
  const [lastTap, setLastTap] = useState<number>(0);
  const DOUBLE_TAP_DELAY = 300;

  const handlePress = () => {
    const now = Date.now();
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      if (explanation) {
        showToast(explanation);
      }
    } else {
      setLastTap(now);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={explanation ? 0.7 : 1}
      onPress={handlePress}
      style={[styles.card, compact && styles.compactCard]}
    >
      <View>
        <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
        <Text style={[
          styles.value,
          compact && styles.compactValue,
          positive && styles.positiveValue,
          negative && styles.negativeValue,
        ]}>
          {value}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  compactCard: {
    padding: 16,
    marginBottom: 12,
    flex: 1,
    minWidth: '45%',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactTitle: {
    fontSize: 11,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: 'bold',
  },
  compactValue: {
    fontSize: 18,
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 11,
    color: '#555',
    marginTop: 6,
  },
});
