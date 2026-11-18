import type { CartProduct, CartResponse } from '@/types';

/** A line with this much or less left is worth a gentle "only N left" note. */
const LOW = 5;

export type LineStock =
  | { kind: 'ok' }
  | { kind: 'low'; left: number }
  /** More in the cart than is in stock: checkout will refuse until the quantity is reduced. */
  | { kind: 'short'; left: number }
  | { kind: 'soldout' };

/** What is left of a cart line's item, from the server's `availableQuantity` (null when the seller doesn't track stock). */
export function lineStock(line: CartProduct): LineStock {
  const left = line.availableQuantity;
  if (left == null) return { kind: 'ok' };
  if (left <= 0) return { kind: 'soldout' };
  if (line.quantity > left) return { kind: 'short', left };
  if (left <= LOW) return { kind: 'low', left };
  return { kind: 'ok' };
}

/** True when one more of this ordinary line would go past the stock. */
export function atStockLimit(line: CartProduct): boolean {
  return line.availableQuantity != null && line.quantity >= line.availableQuantity;
}

/** The most sets of a set's lines the stock allows (null when none of its items is tracked). */
export function maxSetsInStock(lines: CartProduct[]): number | null {
  let max: number | null = null;
  for (const l of lines) {
    if (l.availableQuantity == null || !l.quantityPerSet) continue;
    const fit = Math.floor(l.availableQuantity / l.quantityPerSet);
    max = max == null ? fit : Math.min(max, fit);
  }
  return max;
}

/** The first reason this cart can't be checked out for want of stock, or null. */
export function cartStockIssue(cart: CartResponse): string | null {
  for (const line of cart.products) {
    const s = lineStock(line);
    if (s.kind === 'soldout') return `${line.name} is sold out. Remove it to continue.`;
    if (s.kind === 'short') return `Only ${s.left} left of ${line.name}. Reduce the quantity to continue.`;
  }
  return null;
}
