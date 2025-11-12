export const parseAmountFromText = (text: string): number | null => {
  if (!text) return null;
  // common patterns: INR 1,234.56 | Rs.1,234 | 1,234.00
  const regex = /(?:inr|rs\.?|₹)?\s*([0-9]+(?:[.,][0-9]{2})?(?:[,][0-9]{3})*)/i;
  const m = text.match(regex);
  if (!m) return null;
  let raw = m[1];
  raw = raw.replace(/,/g, '').replace(/\s/g, '');
  const n = parseFloat(raw);
  if (isNaN(n)) return null;
  return n;
};
