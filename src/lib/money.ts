import type { PriceDetail } from '@/types';

const SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh ' };

/** A price as shoppers read it: "₦1,500", "₦1,499.50" (never "NGN 1500"). Unknown currencies fall back to their code. */
export function formatMoney(amount: number, currency = 'NGN'): string {
  const code = (currency || 'NGN').toUpperCase();
  const number = amount.toLocaleString('en-NG', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 });
  return `${SYMBOLS[code] ?? `${code} `}${number}`;
}

/** A product's headline price: "₦500" when it has one price, "From ₦400" when it is sold in several units. */
export function headlinePrice(prices: PriceDetail[] | undefined | null): string | null {
  if (!prices || prices.length === 0) return null;
  const lowest = prices.reduce((min, p) => (p.price < min.price ? p : min), prices[0]);
  return `${prices.length > 1 ? 'From ' : ''}${formatMoney(lowest.price, lowest.currency)}`;
}

/** The unit a product page starts on: its base unit, else the first one, so the price shows straight away. */
export function defaultUnit(prices: PriceDetail[] | undefined | null): PriceDetail | undefined {
  return prices?.find((p) => p.isBaseUnit) ?? prices?.[0];
}
