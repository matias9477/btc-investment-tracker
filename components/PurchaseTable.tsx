import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Purchase } from '../types/database';
import { formatDateShort, formatUSD } from '../lib/calculations';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PurchaseTableProps {
  purchases: Purchase[];
  onDelete: (id: string) => void;
}

/**
 * Modern Data Grid / Table component for displaying purchases
 * Optimized for scannability and quick comparison like an Excel sheet
 */
export const PurchaseTable = ({ purchases, onDelete }: PurchaseTableProps) => {
  const router = useRouter();

  const handleEdit = (id: string) => {
    router.push(`/edit-purchase?id=${id}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Purchase',
      'Are you sure you want to delete this purchase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
        <Text style={[styles.headerCell, styles.priceCol]}>Price</Text>
        <Text style={[styles.headerCell, styles.amountCol]}>BTC</Text>
        <Text style={[styles.headerCell, styles.spentCol]}>Spent</Text>
        <View style={styles.actionCol} />
      </View>

      {/* Table Rows */}
      {purchases.map((purchase) => (
        <TouchableOpacity 
          key={purchase.id} 
          style={styles.row} 
          onPress={() => handleEdit(purchase.id)}
          activeOpacity={0.7}
        >
          <View style={styles.dateCol}>
            <Text style={styles.rowText}>{formatDateShort(purchase.purchase_date)}</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.rowText}>{formatUSD(purchase.btc_price_at_purchase)}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={[styles.rowText, styles.btcText]}>{purchase.btc_amount.toFixed(8)}</Text>
          </View>
          <View style={styles.spentCol}>
            <Text style={[styles.rowText, styles.spentText]}>{formatUSD(purchase.usd_spent)}</Text>
          </View>
          <View style={styles.actionCol}>
            <TouchableOpacity onPress={() => handleDelete(purchase.id)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerCell: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    alignItems: 'center',
  },
  rowText: {
    color: '#FFF',
    fontSize: 12,
  },
  dateCol: {
    width: 65,
  },
  priceCol: {
    flex: 1.2,
    paddingLeft: 4,
  },
  amountCol: {
    flex: 1.2,
    paddingLeft: 4,
  },
  spentCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionCol: {
    width: 25,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  btcText: {
    color: '#F7931A',
  },
  spentText: {
    color: '#FFF',
  },
});
