import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../types';
import { SwipeRow } from 'react-native-swipe-list-view';

type Props = {
  tx: Transaction;
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
};

export default function TransactionItem({ tx, onDelete, onEdit }: Props) {
  return (
    <SwipeRow rightOpenValue={-75} disableRightSwipe>
      {/* Hidden row (delete/edit buttons) */}
      <View style={styles.rowBack}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onEdit && onEdit(tx)}>
          <Text style={{ color: '#fff' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: '#FF3B30' }]} onPress={() => onDelete && onDelete(tx.id)}>
          <Text style={{ color: '#fff' }}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Visible row */}
      <View style={styles.rowFront}>
        <View>
          <Text style={styles.desc}>{tx.description || tx.category}</Text>
          <Text style={styles.sub}>{new Date(tx.date).toLocaleString()}</Text>
        </View>
        <Text style={[styles.amount, { color: tx.type === 'debit' ? '#FF3B30' : '#2ECC71' }]}>
          {tx.type === 'debit' ? '-' : '+'} ₹{Number(tx.amount).toFixed(2)}
        </Text>
      </View>
    </SwipeRow>
  );
}

const styles = StyleSheet.create({
  rowFront: {
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 0,
  },
  backBtn: {
    width: 75,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  desc: { fontWeight: '600' },
  sub: { color: '#666', fontSize: 12 },
  amount: { fontWeight: '700' },
});
