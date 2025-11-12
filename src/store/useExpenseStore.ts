import {create} from 'zustand';
import { Transaction } from '../types';
import { fetchTransactions, insertTransaction, deleteTransaction, updateTransaction } from '../db/database';

type State = {
  transactions: Transaction[];
  load: () => Promise<void>;
  add: (tx: Transaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
  edit: (tx: Transaction) => Promise<void>;
  filter: (opts: { month?: string; category?: string; bank?: string }) => Transaction[];
};

export const useExpenseStore = create<State>(set => ({
  transactions: [],
  load: async () => {
    const items = await fetchTransactions();
    set({ transactions: items });
  },
  add: async tx => {
    await insertTransaction(tx);
    set(s => ({ transactions: [tx, ...s.transactions] }));
  },
  remove: async id => {
    await deleteTransaction(id);
    set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }));
  },
  edit: async tx => {
    await updateTransaction(tx);
    set(s => ({ transactions: s.transactions.map(t => (t.id === tx.id ? tx : t)) }));
  },
  filter: opts => {
    // simple synchronous filter
    // month format: YYYY-MM, e.g. '2025-11'
    const all = (useExpenseStore.getState().transactions || []) as Transaction[];
    return all.filter(t => {
      if (opts.month) {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== opts.month) return false;
      }
      if (opts.category && opts.category !== 'All') {
        if ((t.category || 'Uncategorized') !== opts.category) return false;
      }
      if (opts.bank && opts.bank !== 'All') {
        if ((t.bank || 'Unknown') !== opts.bank) return false;
      }
      return true;
    });
  },
}));
