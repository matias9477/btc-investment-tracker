import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from './ToastProvider';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  positive?: boolean;
  negative?: boolean;
  compact?: boolean;
  explanation?: string;
  gradient?: boolean;
  icon?: keyof typeof Ionicons.prototype.props.name;
  iconColor?: string;
  accentColor?: string;
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
  gradient = false,
  icon,
  iconColor = '#F7931A',
  accentColor,
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

  const CardContent = (
    <View style={[styles.contentWrapper, !compact && styles.fullWidthContent]}>
      <View style={styles.textContainer}>
        <Text style={[
          styles.title, 
          compact && styles.compactTitle,
          gradient && styles.gradientTitle
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.value,
          compact && styles.compactValue,
          positive && styles.positiveValue,
          negative && styles.negativeValue,
          gradient && styles.gradientValue,
        ]}>
          {value}
        </Text>
        {subtitle && (
          <Text style={[
            styles.subtitle,
            gradient && styles.gradientSubtitle
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      {icon && !compact && (
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon as any} size={28} color={iconColor} />
        </View>
      )}
    </View>
  );

  const containerStyles = [
    styles.card, 
    compact && styles.compactCard,
    gradient && styles.gradientCard,
    accentColor && { borderColor: `${accentColor}40` }
  ];

  if (gradient) {
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.cardContainer, compact && styles.compactCardContainer]}
      >
        <LinearGradient
          colors={['#1A1A1A', '#0A0A0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={containerStyles}
        >
          {CardContent}
          <View style={[styles.glowEffect, { backgroundColor: `${accentColor || '#F7931A'}10` }]} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={explanation ? 0.7 : 1}
      onPress={handlePress}
      style={[compact ? styles.compactCardContainer : styles.cardContainer]}
    >
      <View style={containerStyles}>
        {CardContent}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  compactCardContainer: {
    flex: 1,
    minWidth: '45%',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  gradientCard: {
    borderColor: '#333',
  },
  compactCard: {
    padding: 16,
  },
  contentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullWidthContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  gradientTitle: {
    color: '#AAA',
  },
  compactTitle: {
    fontSize: 11,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gradientValue: {
    fontSize: 28,
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
    color: '#777',
    marginTop: 6,
  },
  gradientSubtitle: {
    color: '#888',
  },
  glowEffect: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});
