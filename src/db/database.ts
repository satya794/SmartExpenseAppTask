import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Transaction } from '../types';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DB_NAME = 'expenses.db';

export const getDB = async (): Promise<SQLiteDatabase> => {
  return SQLite.openDatabase({ name: DB_NAME, location: 'default' });
};

export const initDB = async () => {
  const db = await getDB();
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL,
      type TEXT,
      date TEXT,
      bank TEXT,
      description TEXT,
      category TEXT,
      source TEXT
    );`,
  );
  return db;
};

export const insertTransaction = async (tx: Transaction) => {
  const db = await getDB();
  // ensure we never pass null -> use empty string
  await db.executeSql(
    `INSERT OR REPLACE INTO transactions (id, amount, type, date, bank, description, category, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      tx.id ?? '',
      tx.amount ?? 0,
      tx.type ?? 'debit',
      tx.date ?? new Date().toISOString(),
      tx.bank ?? '',
      tx.description ?? '',
      tx.category ?? '',
      tx.source ?? 'manual',
    ],
  );
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const db = await getDB();
  const res = await db.executeSql(`SELECT * FROM transactions ORDER BY date DESC;`);
  const rows = res[0].rows;
  const items: Transaction[] = [];
  for (let i = 0; i < rows.length; i++) items.push(rows.item(i));
  return items;
};

export const deleteTransaction = async (id: string) => {
  const db = await getDB();
  await db.executeSql(`DELETE FROM transactions WHERE id = ?;`, [id]);
};

export const updateTransaction = async (tx: Transaction) => {
  const db = await getDB();
  await db.executeSql(
    `UPDATE transactions SET amount = ?, type = ?, date = ?, bank = ?, description = ?, category = ?, source = ? WHERE id = ?;`,
    [
      tx.amount ?? 0,
      tx.type ?? 'debit',
      tx.date ?? new Date().toISOString(),
      tx.bank ?? '',
      tx.description ?? '',
      tx.category ?? '',
      tx.source ?? 'manual',
      tx.id ?? '',
    ],
  );
};
