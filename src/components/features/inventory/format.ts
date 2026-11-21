import type { CoverStatus, StockMovementType } from '@/types/inventory';

const NGN = 'en-NG';

/** A stock quantity: whole numbers plainly, fractions to at most two places ("12", "2.5"). */
export function formatQty(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString(NGN) : n.toLocaleString(NGN, { maximumFractionDigits: 2 });
}

/** A signed change with a real minus sign: "+5", "−3". */
export function formatSigned(n: number): string {
  if (n === 0) return '0';
  return `${n > 0 ? '+' : '−'}${formatQty(Math.abs(n))}`;
}

/** Naira: "₦1,500" or "₦1,499.50"; a dash when there is no figure. */
export function formatNaira(n: number | null | undefined): string {
  if (n == null) return '—';
  return `₦${n.toLocaleString(NGN, { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** Date and time as Nigerians read them, in Lagos time: "20 Nov 2026, 4:06 pm". */
export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** "Tue 25 Nov" for a YYYY-MM-DD date. */
export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}

/** Parses what a seller typed into a number: digits and one dot, commas ignored. Null when it is empty or not a number. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Keeps only what can be part of an amount while typing: digits and one dot, with at most `decimals` places. */
export function cleanAmountText(raw: string, decimals = 2): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('').slice(0, decimals)}` : whole;
}

/** What selling a product at `price` that cost `cost` leaves: the amount per unit and the margin as a share of the price. */
export function marginOf(price: number | null | undefined, cost: number | null | undefined): { amount: number; pct: number } | null {
  if (price == null || cost == null || price <= 0) return null;
  const amount = price - cost;
  return { amount, pct: Math.round((amount / price) * 100) };
}

export interface StatusMeta {
  label: string;
  /** Tailwind classes for the chip. */
  chip: string;
  /** Lower sorts first (most urgent). */
  rank: number;
}

export const COVER_STATUS: Record<CoverStatus, StatusMeta> = {
  OUT: { label: 'Out of stock', chip: 'bg-red-50 text-red-700 ring-red-200', rank: 0 },
  CRITICAL: { label: 'Running out', chip: 'bg-orange-50 text-orange-700 ring-orange-200', rank: 1 },
  LOW: { label: 'Running low', chip: 'bg-amber-50 text-amber-700 ring-amber-200', rank: 2 },
  OK: { label: 'Healthy', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', rank: 3 },
  NO_SALES: { label: 'No recent sales', chip: 'bg-slate-100 text-slate-600 ring-slate-200', rank: 4 },
  UNTRACKED: { label: 'Not tracked', chip: 'bg-slate-50 text-slate-500 ring-slate-200', rank: 5 },
};

export const MOVEMENT_TYPE: Record<StockMovementType, { label: string; chip: string }> = {
  INITIAL: { label: 'Opening stock', chip: 'bg-slate-100 text-slate-700 ring-slate-200' },
  RESTOCK: { label: 'Restock', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  SALE: { label: 'Sale', chip: 'bg-blue-50 text-blue-700 ring-blue-200' },
  CANCELLATION: { label: 'Order cancelled', chip: 'bg-violet-50 text-violet-700 ring-violet-200' },
  ADJUSTMENT: { label: 'Correction', chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
};
