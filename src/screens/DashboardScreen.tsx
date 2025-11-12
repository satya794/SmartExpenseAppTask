import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import TransactionItem from '../components/TransactionItem';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }: any) => {
  const load = useExpenseStore(s => s.load);
  const transactions = useExpenseStore(s => s.transactions);

  useEffect(() => {
    const init = async () => {
      try {
        await load();
      } catch (e) {
        console.error('Error loading transactions:', e);
      }
    };
    init();
    // AsyncStorage.removeItem('onboarded');
    // AsyncStorage.removeItem('biometric_enabled');
  }, [load]);

  const totalBalance = useMemo(() => {
    if (!transactions?.length) return 0;
    return transactions.reduce(
      (acc, t) => (t.type === 'debit' ? acc - (t.amount || 0) : acc + (t.amount || 0)),
      0
    );
  }, [transactions]);

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const monthlyExpenses = useMemo(() => {
    if (!transactions?.length) return 0;
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === currentMonth && t.type === 'debit';
      })
      .reduce((s, t) => s + (t.amount || 0), 0);
  }, [transactions, currentMonth]);

  // ✅ BarChart data - formatted correctly for react-native-chart-kit
  const chartData = useMemo(() => {
    if (!transactions?.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const map = new Map<string, number>();
    transactions.forEach(t => {
      const cat = t.category || 'Other';
      if (t.type === 'debit') {
        map.set(cat, (map.get(cat) || 0) + (t.amount || 0));
      }
    });

    const labels = Array.from(map.keys());
    const data = Array.from(map.values());

    if (data.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    return {
      labels: labels.slice(0, 6), // limit to 6 for readability
      datasets: [{ data: data.slice(0, 6) }],
    };
  }, [transactions]);

  const handleDelete = async (id: string) => {
    try {
      await useExpenseStore.getState().remove(id);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleEdit = (tx: any) => {
    navigation.navigate('AddExpense', { prefill: tx });
  };

  if (!transactions) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const hasData = chartData.datasets?.[0]?.data?.length > 0 && chartData.datasets[0].data.some(v => v > 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddExpense')}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Total balance card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Balance</Text>
        <Text style={styles.balance}>₹ {totalBalance.toFixed(2)}</Text>
        <Text style={styles.monthlyText}>
          Monthly Expenses: ₹ {monthlyExpenses.toFixed(2)}
        </Text>
      </View>

      {/* Bar chart */}
      <Text style={styles.sectionTitle}>Spending by Category</Text>
      <View style={styles.chartContainer}>
        {hasData ? (
          <BarChart
            data={chartData}
            width={screenWidth - 32}
            height={250}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
              barPercentage: 0.7,
              propsForLabels: {
                fontSize: 12,
                fontWeight: '600',
              },
            }}
            style={{ borderRadius: 16 }}
          />
        ) : (
          <Text style={styles.emptyText}>No expense data to show</Text>
        )}
      </View>

      {/* Category breakdown list */}
     {hasData && (
  <View style={styles.categoryList}>
    <Text style={styles.sectionTitle}>Category Breakdown</Text>

    {Array.from(
      transactions
        .filter(t => t.type === 'debit')
        .reduce((acc, t) => {
          const category = t.category || 'Other';
          const amount = parseFloat(t.amount) || 0;
          acc.set(category, (acc.get(category) || 0) + amount);
          return acc;
        }, new Map())
        .entries()
    ).map(([cat, total]) => (
      <View key={cat} style={styles.categoryRow}>
        <Text style={styles.categoryName}>{cat}</Text>
        <Text style={styles.categoryAmount}>₹ {total.toFixed(2)}</Text>
      </View>
    ))}
  </View>
)}


      {/* Last 5 Transactions */}
      <Text style={styles.sectionTitle}>Last 5 Transactions</Text>
      {transactions.length > 0 ? (
        <FlatList
          data={transactions.slice(0, 5)}
          keyExtractor={t => t.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TransactionItem tx={item} onDelete={handleDelete} onEdit={handleEdit} />
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No transactions yet</Text>
      )}

      {/* View all */}
      {transactions?.length > 5 ? (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Text style={styles.viewAllText}>View All Transactions</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
    color: '#000',
  },
  monthlyText: {
    marginTop: 12,
    color: '#555',
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: '700',
    fontSize: 16,
    color: '#000',
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  viewAllButton: {
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
