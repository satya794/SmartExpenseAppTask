import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import TransactionItem from '../components/TransactionItem';
import { Swipeable } from 'react-native-gesture-handler';
import { TextInput, Button } from 'react-native-paper';

const CATEGORIES = ['UPI', 'Cash', 'Payment', 'Shopping', 'Food', 'Bills', 'Transport', 'Entertainment', 'Other'];
const BANKS = ['All Banks', 'SBI', 'HDFC', 'ICICI', 'Axis', 'Other'];

const TransactionHistoryScreen = ({ navigation }: any) => {
  const load = useExpenseStore(s => s.load);
  const transactions = useExpenseStore(s => s.transactions);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('All Banks');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    load();
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, [load]);

  // ✅ Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Month filter
      if (selectedMonth) {
        const tDate = new Date(t.date);
        const tMonth = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        if (tMonth !== selectedMonth) return false;
      }

      // Category filter
      if (selectedCategory && t.category !== selectedCategory) return false;

      // Bank filter
      if (selectedBank !== 'All Banks' && t.bank !== selectedBank) return false;

      // Search filter
      if (searchText && !t.description?.toLowerCase().includes(searchText.toLowerCase())) return false;

      return true;
    });
  }, [transactions, selectedMonth, selectedCategory, selectedBank, searchText]);

  // ✅ Get unique months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const d = new Date(t.date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const handleDelete = async (id: string) => {
    await useExpenseStore.getState().remove(id);
  };

  const handleEdit = (tx: any) => {
    navigation.navigate('AddExpense', { prefill: tx });
  };

  // ✅ Swipe actions
  const renderLeftActions = (tx: any) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDelete(tx.id)}
    >
      <Text style={styles.actionText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderRightActions = (tx: any) => (
    <TouchableOpacity
      style={styles.editAction}
      onPress={() => handleEdit(tx)}
    >
      <Text style={styles.actionText}>Edit</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>🔍 Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {/* <TextInput
        label="Search notes..."
        value={searchText}
        onChangeText={setSearchText}
        mode="outlined"
        style={styles.searchInput}
        activeOutlineColor="#007AFF"
      /> */}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Transactions</Text>

            <ScrollView style={{ maxHeight: '70%' }}>
              {/* Month Filter */}
              <Text style={styles.filterLabel}>Month</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedMonth && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedMonth('')}
                >
                  <Text style={!selectedMonth ? styles.filterOptionTextActive : styles.filterOptionText}>All Months</Text>
                </TouchableOpacity>
                {availableMonths.map(month => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.filterOption,
                      selectedMonth === month && styles.filterOptionActive,
                    ]}
                    onPress={() => setSelectedMonth(month)}
                  >
                    <Text style={selectedMonth === month ? styles.filterOptionTextActive : styles.filterOptionText}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Filter */}
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedCategory && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={!selectedCategory ? styles.filterOptionTextActive : styles.filterOptionText}>All</Text>
                </TouchableOpacity>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterOption,
                      selectedCategory === cat && styles.filterOptionActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={selectedCategory === cat ? styles.filterOptionTextActive : styles.filterOptionText}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bank Filter */}
              <Text style={styles.filterLabel}>Bank</Text>
              <View style={styles.filterOptions}>
                {BANKS.map(bank => (
                  <TouchableOpacity
                    key={bank}
                    style={[
                      styles.filterOption,
                      selectedBank === bank && styles.filterOptionActive,
                    ]}
                    onPress={() => setSelectedBank(bank)}
                  >
                    <Text style={selectedBank === bank ? styles.filterOptionTextActive : styles.filterOptionText}>
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setSelectedMonth('');
                  setSelectedCategory('');
                  setSelectedBank('All Banks');
                  setSearchText('');
                }}
              >
                Clear All
              </Button>
              <Button mode="contained" onPress={() => setShowFilterModal(false)}>
                Done
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Active Filters Display */}
      {(selectedMonth || selectedCategory || selectedBank !== 'All Banks' || searchText) && (
        <View style={styles.activeFilters}>
          {selectedMonth && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedMonth} ✕</Text>
            </View>
          )}
          {selectedCategory && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedCategory} ✕</Text>
            </View>
          )}
          {selectedBank !== 'All Banks' && (
            <View style={styles.filterTag}>
              <Text style={styles.filterTagText}>{selectedBank} ✕</Text>
            </View>
          )}
        </View>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Text style={styles.empty}>No transactions found.</Text>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <Swipeable
              renderLeftActions={() => renderLeftActions(item)}
              renderRightActions={() => renderRightActions(item)}
            >
              <TransactionItem tx={item} onDelete={handleDelete} onEdit={handleEdit} />
            </Swipeable>
          )}
          ListHeaderComponent={() => (
            <Text style={styles.resultCount}>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </Text>
          )}
        />
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TransactionHistoryScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    padding: 16,
    marginTop: 40 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700',
    color: '#000' 
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchInput: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  filterTag: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterTagText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#000',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  editAction: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  empty: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: { 
    marginTop: 20, 
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: { 
    color: '#007AFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
