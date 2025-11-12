import SmsListener from 'react-native-sms-receiver';
import { isBankSms, parseSmsToTransaction } from './smsParser';
import { insertTransaction } from '../db/database';

let sub: any = null;

export const startSmsListener = () => {
  try {
    // SmsListener.addListener signature returns subscription
    sub = SmsListener.addListener((message: { originatingAddress?: string; origin?: string; body?: string }) => {
      const origin = message.originatingAddress || message.origin || 'UNKNOWN';
      const body = message.body || '';
      if (!isBankSms(origin, body)) return;
      const tx = parseSmsToTransaction(origin, body);
      if (tx) insertTransaction(tx).catch(e => console.warn('insertTransaction failed', e));
    });
  } catch (e) {
    console.warn('startSmsListener failed', e);
  }
};

export const stopSmsListener = () => {
  if (sub && sub.remove) sub.remove();
  sub = null;
};
