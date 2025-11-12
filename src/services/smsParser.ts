import { Transaction } from '../types';
import { parseAmountFromText } from '../utils/regexUtils';

// add banks you want to match
const BANK_KEYWORDS = ['HDFCBK', 'HDFC', 'AXISBK', 'AXIS', 'ICICI', 'SBI', 'SBIN', 'PNB', 'KOTAK'];

export const isBankSms = (origin: string, body: string): boolean => {
  const o = (origin || '').toUpperCase();
  if (BANK_KEYWORDS.some(k => o.includes(k))) return true;
  const lowered = (body || '').toLowerCase();
  return (
    lowered.includes('debited') ||
    lowered.includes('credited') ||
    lowered.includes('withdrawn') ||
    lowered.includes('purchase') ||
    lowered.includes('transaction of') ||
    lowered.includes('available balance') ||
    lowered.includes('avl bal')
  );
};

export const parseSmsToTransaction = (origin: string, body: string): Transaction | null => {
  try {
    const amount = parseAmountFromText(body);
    if (amount == null) return null;

    const type =
      /credit(ed)?|deposit/i.test(body) && !/debited/i.test(body) ? 'credit' : /debit(ed)?|withdrawn|spent|purchase|is used/i.test(body) ? 'debit' : 'debit';

    // try to find date in body (dd/mm/yyyy or dd-mm-yyyy)
    const dateMatch = body.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const date = dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString();

    const bank = origin || 'Unknown';
    const description = body ? body.slice(0, 200) : '';

    return {
      id: `${bank}_${Date.now()}`,
      amount,
      type,
      date,
      bank,
      description,
      category: 'Uncategorized',
      source: 'sms',
    } as Transaction;
  } catch (e) {
    console.warn('parseSmsToTransaction error', e);
    return null;
  }
};
