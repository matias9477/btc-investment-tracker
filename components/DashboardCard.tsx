import { View, Text, StyleSheet } from 'react-native';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  positive?: boolean;
  negative?: boolean;
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
}: DashboardCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[
        styles.value,
        positive && styles.positiveValue,
        negative && styles.negativeValue,
      ]}>
        {value}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
