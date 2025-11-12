export type Transaction = {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string; // ISO
  bank?: string;
  description?: string;
  category?: string;
  source: 'sms' | 'manual';
};
