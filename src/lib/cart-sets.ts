'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useGuestCartStore, type GuestSetInput, type GuestSetItem } from '@/stores/guest-cart.store';
import type { CartGroup, CartGroupRequest, CartProduct, CartResponse, OrderItem } from '@/types';

/**
 * Cart "sets": the same combination of items ordered several times (10 × a wrap and a juice).
 * Two entry designs are built side by side so they can be tested and compared:
 *   Design 1 — group items already in the cart ("Group items" in the cart).
 *   Design 2 — build one set on the store, then choose how many ("Build a set").
 * Both create the same thing, so everything downstream (checkout, stock, orders) is shared.
 */

// ─── Which design is on (QA switch) ───────────────────────────────────────────

export type SetsVariant = 'off' | '1' | '2' | 'both';

export const SETS_VARIANT_KEY = 'mm-sets-variant';
const SETS_VARIANT_EVENT = 'mm-sets-variant-change';
const DEFAULT_VARIANT: SetsVariant = 'both';
const VALID: SetsVariant[] = ['off', '1', '2', 'both'];

function readVariant(): { variant: SetsVariant; overridden: boolean } {
  if (typeof window === 'undefined') return { variant: DEFAULT_VARIANT, overridden: false };
  try {
    // `?sets=1|2|both|off` switches design and sticks; `?sets=default` clears it.
    const fromUrl = new URLSearchParams(window.location.search).get('sets');
    if (fromUrl === 'default') localStorage.removeItem(SETS_VARIANT_KEY);
    else if (fromUrl && (VALID as string[]).includes(fromUrl)) localStorage.setItem(SETS_VARIANT_KEY, fromUrl);
    const stored = localStorage.getItem(SETS_VARIANT_KEY);
    if (stored && (VALID as string[]).includes(stored)) return { variant: stored as SetsVariant, overridden: true };
  } catch {
    // storage blocked: fall through to the default
  }
  return { variant: DEFAULT_VARIANT, overridden: false };
}

/** Switch design from code (the QA badge). `null` goes back to the default. */
export function setSetsVariant(variant: SetsVariant | null) {
  try {
    if (variant === null) localStorage.removeItem(SETS_VARIANT_KEY);
    else localStorage.setItem(SETS_VARIANT_KEY, variant);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(SETS_VARIANT_EVENT));
}

export function useSetsVariant() {
  const [state, setState] = useState<{ variant: SetsVariant; overridden: boolean }>({
    variant: DEFAULT_VARIANT,
    overridden: false,
  });
  useEffect(() => {
    const sync = () => setState(readVariant());
    sync();
    window.addEventListener(SETS_VARIANT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SETS_VARIANT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return {
    ...state,
    /** Group items already in the cart. */
    design1: state.variant === '1' || state.variant === 'both',
    /** Build a set, then choose how many. */
    design2: state.variant === '2' || state.variant === 'both',
  };
}

// ─── Splitting a cart / order into sets and loose lines ───────────────────────

export interface SetView {
  group: CartGroup;
  lines: CartProduct[];
  /** Price of ONE set. */
  perSetPrice: number;
}

export const perSetPriceOf = (lines: CartProduct[]) =>
  lines.reduce((sum, l) => sum + l.unitPrice * (l.quantityPerSet ?? 0), 0);

/** The cart's sets (with their lines) and its ordinary lines. Cart totals already include everything. */
export function splitCart(cart: CartResponse): { sets: SetView[]; loose: CartProduct[] } {
  const sets: SetView[] = (cart.groups ?? []).map((group) => {
    const lines = cart.products.filter((p) => p.groupId === group.groupId);
    return { group, lines, perSetPrice: perSetPriceOf(lines) };
  });
  return { sets: sets.filter((s) => s.lines.length > 0), loose: cart.products.filter((p) => p.groupId == null) };
}

export interface OrderSetView {
  groupId: number;
  name: string;
  sets: number;
  lines: OrderItem[];
  perSetPrice: number;
  total: number;
}

/** Same split for an order's items (name and sets are repeated on each member line). */
export function splitOrderItems(items: OrderItem[]): { sets: OrderSetView[]; loose: OrderItem[] } {
  const byGroup = new Map<number, OrderSetView>();
  for (const item of items) {
    if (item.groupId == null) continue;
    const existing = byGroup.get(item.groupId);
    const perSet = item.unitPrice * (item.quantityPerSet ?? 0);
    if (existing) {
      existing.lines.push(item);
      existing.perSetPrice += perSet;
      existing.total += item.totalPrice;
    } else {
      byGroup.set(item.groupId, {
        groupId: item.groupId,
        name: item.groupName || 'Set',
        sets: item.groupSets ?? 1,
        lines: [item],
        perSetPrice: perSet,
        total: item.totalPrice,
      });
    }
  }
  return { sets: [...byGroup.values()], loose: items.filter((i) => i.groupId == null) };
}

/** What the seller has to prepare: every item totalled across sets and ordinary lines. */
export function packingList(items: Pick<OrderItem, 'name' | 'unit' | 'quantity'>[]) {
  const totals = new Map<string, { name: string; unit: string; quantity: number }>();
  for (const i of items) {
    const key = `${i.name}\u0000${i.unit}`;
    const t = totals.get(key);
    if (t) t.quantity += i.quantity;
    else totals.set(key, { name: i.name, unit: i.unit, quantity: i.quantity });
  }
  return [...totals.values()];
}

// ─── Turning lines already in the cart into a set (Design 1) ──────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Suggests how to split ordinary lines into sets WITHOUT changing any totals: 10 wraps and 10 juices
 * become 10 sets of 1 + 1; 10 wraps and 20 juices become 10 sets of 1 + 2. Quantities that aren't whole
 * numbers fall back to one set holding everything.
 */
export function suggestSet(quantities: number[]): { sets: number; perSet: number[] } {
  if (quantities.length === 0 || quantities.some((q) => !Number.isInteger(q) || q < 1)) {
    return { sets: 1, perSet: quantities };
  }
  const sets = quantities.reduce(gcd);
  return { sets, perSet: quantities.map((q) => q / sets) };
}

// ─── Create / edit / remove a set, for signed-in and guest carts alike ────────

export type SetItemInput = GuestSetItem;

export interface SetInput extends GuestSetInput {
  items: SetItemInput[];
}

/**
 * Actions on the sets of one store's cart. A signed-in cart goes through the API; a guest cart through
 * the local store. All three throw on failure (the API's message is in the error — use getApiError).
 */
export function useCartSetsActions(businessId: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const afterServerChange = (cart: CartResponse) => {
    useCartStore.getState().updateCart(cart);
    qc.invalidateQueries({ queryKey: ['carts'] });
  };

  const toRequest = (input: SetInput): CartGroupRequest => ({
    businessId,
    name: input.name,
    sets: input.sets,
    absorbLoose: input.absorbLoose,
    items: input.items.map((i) => ({
      productId: i.productId,
      unitId: i.unitId,
      quantityPerSet: i.quantityPerSet,
      note: i.note,
    })),
  });

  return {
    createSet: async (input: SetInput): Promise<void> => {
      if (isAuthenticated) afterServerChange(await cartApi.createGroup(toRequest(input)));
      else useGuestCartStore.getState().createGroup(businessId, input);
    },
    updateSet: async (groupId: number, input: SetInput): Promise<void> => {
      if (isAuthenticated) afterServerChange(await cartApi.updateGroup(groupId, toRequest(input)));
      else useGuestCartStore.getState().updateGroup(businessId, groupId, input);
    },
    /** `ungroup` keeps the items as ordinary lines; `remove` takes them out of the cart. */
    removeSet: async (groupId: number, mode: 'ungroup' | 'remove'): Promise<void> => {
      if (isAuthenticated) afterServerChange(await cartApi.deleteGroup(groupId, mode));
      else useGuestCartStore.getState().deleteGroup(businessId, groupId, mode);
    },
  };
}
