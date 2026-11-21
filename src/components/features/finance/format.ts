import { format, parseISO } from 'date-fns';
import type { ExpenseCategory } from '@/types/finance';

/** ₦1,234.50 — exact, two decimals, for tables and statements. Negative amounts read −₦1,234.50. */
export function naira(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value < 0 ? '−' : ''}₦${abs}`;
}

/** ₦1,235 — whole naira, for the big numbers on cards (the exact figure is in the tooltip/table). */
export function nairaWhole(value: number): string {
  const abs = Math.abs(Math.round(value)).toLocaleString('en-NG');
  return `${value < 0 && Math.round(value) !== 0 ? '−' : ''}₦${abs}`;
}

export function percent(value: number | null | undefined): string {
  return value == null ? '—' : `${value.toFixed(1)}%`;
}

/** "12 Nov 2026" from a YYYY-MM-DD date. */
export function shortDate(date: string): string {
  try {
    return format(parseISO(date), 'd MMM yyyy');
  } catch {
    return date;
  }
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; hint: string; color: string; bg: string }[] = [
  { value: 'STOCK_PURCHASE', label: 'Stock purchases', hint: 'Goods or ingredients you bought to sell', color: '#0058be', bg: '#eff4ff' },
  { value: 'DELIVERY', label: 'Delivery', hint: 'Couriers, fuel, dispatch riders', color: '#0891b2', bg: '#ecfeff' },
  { value: 'RENT', label: 'Rent', hint: 'Shop, stall, kitchen or storage', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'SALARIES', label: 'Salaries & wages', hint: 'Staff pay and casual labour', color: '#db2777', bg: '#fdf2f8' },
  { value: 'MARKETING', label: 'Marketing', hint: 'Ads, flyers, promotions', color: '#ea580c', bg: '#fff7ed' },
  { value: 'UTILITIES', label: 'Utilities', hint: 'Electricity, water, internet, data', color: '#ca8a04', bg: '#fefce8' },
  { value: 'EQUIPMENT', label: 'Equipment', hint: 'Tools, machines, furniture', color: '#059669', bg: '#ecfdf5' },
  { value: 'FEES', label: 'Fees & charges', hint: 'Bank charges, licences, permits', color: '#475569', bg: '#f1f5f9' },
  { value: 'OTHER', label: 'Other', hint: 'Anything that does not fit above', color: '#64748b', bg: '#f8fafc' },
];

const CATEGORY_BY_VALUE = new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c]));

export function categoryMeta(category: ExpenseCategory) {
  return CATEGORY_BY_VALUE.get(category) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}
