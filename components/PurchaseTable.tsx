import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Purchase } from '../types/database';
import { formatDateShort, formatUSD } from '../lib/calculations';

type SortColumn = 'date' | 'price' | 'amount' | 'spent';
type SortDirection = 'asc' | 'desc';

interface PurchaseTableProps {
  purchases: Purchase[];
}

/**
 * Sorts a purchases array by the given column and direction.
 */
const sortPurchases = (
  purchases: Purchase[],
  column: SortColumn,
  direction: SortDirection,
): Purchase[] => {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...purchases].sort((a, b) => {
    switch (column) {
      case 'date':
        return (
          multiplier *
          (new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())
        );
      case 'price':
        return multiplier * (a.btc_price_at_purchase - b.btc_price_at_purchase);
      case 'amount':
        return multiplier * (a.btc_amount - b.btc_amount);
      case 'spent':
        return multiplier * (a.usd_spent - b.usd_spent);
    }
  });
};

/**
 * Read-only sortable data grid displaying purchases sourced from Google Sheets.
 * Tap any column header to sort by that column; tap again to reverse direction.
 * Defaults to date descending (most recent first).
 */
export const PurchaseTable = ({ purchases }: PurchaseTableProps) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleHeaderPress = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedPurchases = useMemo(
    () => sortPurchases(purchases, sortColumn, sortDirection),
    [purchases, sortColumn, sortDirection],
  );

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <Ionicons name="swap-vertical-outline" size={11} color="#555" style={styles.sortIcon} />;
    }
    return (
      <Ionicons
        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
        size={11}
        color="#F7931A"
        style={styles.sortIcon}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <TouchableOpacity
          style={[styles.headerCellWrapper, styles.dateCol]}
          onPress={() => handleHeaderPress('date')}
          accessibilityLabel="Sort by date"
          accessibilityRole="button"
        >
          <Text style={[styles.headerCell, sortColumn === 'date' && styles.headerCellActive]}>
            Date
          </Text>
          <SortIcon column="date" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerCellWrapper, styles.priceCol]}
          onPress={() => handleHeaderPress('price')}
          accessibilityLabel="Sort by price"
          accessibilityRole="button"
        >
          <Text style={[styles.headerCell, sortColumn === 'price' && styles.headerCellActive]}>
            Price
          </Text>
          <SortIcon column="price" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerCellWrapper, styles.amountCol]}
          onPress={() => handleHeaderPress('amount')}
          accessibilityLabel="Sort by BTC amount"
          accessibilityRole="button"
        >
          <Text style={[styles.headerCell, sortColumn === 'amount' && styles.headerCellActive]}>
            BTC
          </Text>
          <SortIcon column="amount" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerCellWrapper, styles.spentCol]}
          onPress={() => handleHeaderPress('spent')}
          accessibilityLabel="Sort by amount spent"
          accessibilityRole="button"
        >
          <Text style={[styles.headerCell, sortColumn === 'spent' && styles.headerCellActive]}>
            Spent
          </Text>
          <SortIcon column="spent" />
        </TouchableOpacity>
      </View>

      {/* Table Rows */}
      {sortedPurchases.map((purchase) => (
        <View key={purchase.id} style={styles.row}>
          <View style={styles.dateCol}>
            <Text style={styles.rowText}>{formatDateShort(purchase.purchase_date)}</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.rowText}>{formatUSD(purchase.btc_price_at_purchase)}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={[styles.rowText, styles.btcText]}>
              {purchase.btc_amount.toFixed(8)}
            </Text>
          </View>
          <View style={styles.spentCol}>
            <Text style={styles.rowText}>{formatUSD(purchase.usd_spent)}</Text>
          </View>
        </View>
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
  headerCellWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  headerCell: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerCellActive: {
    color: '#F7931A',
  },
  sortIcon: {
    marginTop: 1,
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
  btcText: {
    color: '#F7931A',
  },
});
