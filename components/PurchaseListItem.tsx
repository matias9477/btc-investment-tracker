import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Purchase } from '../types/database';
import { formatDate, formatUSD, formatBTC } from '../lib/calculations';

interface PurchaseListItemProps {
  purchase: Purchase;
  onDelete: (id: string) => void;
}

/**
 * List item component for displaying a single purchase
 */
export const PurchaseListItem = ({ purchase, onDelete }: PurchaseListItemProps) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/edit-purchase?id=${purchase.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Purchase',
      'Are you sure you want to delete this purchase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(purchase.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleEdit} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(purchase.purchase_date)}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleEdit(); }} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(); }} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>BTC Price:</Text>
            <Text style={styles.detailValue}>{formatUSD(purchase.btc_price_at_purchase)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>BTC Amount:</Text>
            <Text style={styles.detailValue}>{formatBTC(purchase.btc_amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>USD Spent:</Text>
            <Text style={[styles.detailValue, styles.usdSpent]}>
              {formatUSD(purchase.usd_spent)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F7931A',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F7931A',
  },
  editButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  usdSpent: {
    color: '#F7931A',
    fontSize: 16,
  },
});
