import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartResponse, CartProduct } from '@/types';

export interface GuestCartItem {
  productId: number;
  unitId: number;
  quantity: number;
  name: string;
  type: string;
  image: string;
  unit: string;
  unitPrice: number;
  note?: string;
  /** Set this line belongs to (a GuestGroup id); absent for an ordinary line. */
  groupId?: number;
  /** Units in ONE set. `quantity` is already quantityPerSet × the group's sets. */
  quantityPerSet?: number;
}

export interface GuestGroup {
  id: number;
  name: string;
  sets: number;
}

export interface GuestCart {
  businessId: number;
  items: GuestCartItem[];
  /** Absent in carts saved before sets existed. */
  groups?: GuestGroup[];
}

/** What a set is made of; the display fields are what the guest cart needs to render lines without the server. */
export type GuestSetItem = Omit<GuestCartItem, 'quantity' | 'groupId'> & { quantityPerSet: number };

export interface GuestSetInput {
  name?: string;
  sets: number;
  items: GuestSetItem[];
  /** Create only: drop the ordinary lines for these same items. */
  absorbLoose?: boolean;
}

interface GuestCartState {
  carts: GuestCart[];
  addItem: (businessId: number, item: Omit<GuestCartItem, 'quantity'> & { quantity: number }) => void;
  removeItem: (businessId: number, productId: number, unitId: number) => void;
  decrementItem: (businessId: number, productId: number, unitId: number) => void;
  /** Sets an ordinary line to exactly this many (at least 1). */
  setItemQuantity: (businessId: number, productId: number, unitId: number, quantity: number) => void;
  createGroup: (businessId: number, input: GuestSetInput) => void;
  updateGroup: (businessId: number, groupId: number, input: GuestSetInput) => void;
  /** `ungroup` keeps the items as ordinary lines; `remove` drops them. */
  deleteGroup: (businessId: number, groupId: number, mode: 'ungroup' | 'remove') => void;
  clearBusiness: (businessId: number) => void;
  clearAll: () => void;
  getCart: (businessId: number) => GuestCart | undefined;
  getTotalItems: () => number;
}

const newGroupId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

function nextSetName(groups: GuestGroup[]): string {
  const used = new Set(groups.map((g) => g.name));
  let n = 1;
  while (used.has(`Set ${n}`)) n++;
  return `Set ${n}`;
}

/** The ordinary cart lines a set expands to: each holds the full total (per set × sets). */
function setLines(group: GuestGroup, input: GuestSetInput): GuestCartItem[] {
  return input.items.map((i) => ({
    ...i,
    quantity: i.quantityPerSet * group.sets,
    groupId: group.id,
  }));
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      carts: [],

      addItem: (businessId, item) => {
        set((state) => {
          const cartIndex = state.carts.findIndex((c) => c.businessId === businessId);
          if (cartIndex === -1) {
            return { carts: [...state.carts, { businessId, items: [item] }] };
          }
          const cart = state.carts[cartIndex];
          const itemIndex = cart.items.findIndex(
            (i) => i.groupId == null && i.productId === item.productId && i.unitId === item.unitId
          );
          const items =
            itemIndex === -1
              ? [...cart.items, item]
              : cart.items.map((i, idx) =>
                  idx === itemIndex
                    ? {
                        ...i,
                        quantity: i.quantity + item.quantity,
                        note: item.note !== undefined ? item.note : i.note,
                      }
                    : i
                );
          const carts = [...state.carts];
          carts[cartIndex] = { ...cart, items };
          return { carts };
        });
      },

      removeItem: (businessId, productId, unitId) => {
        set((state) => ({
          carts: state.carts
            .map((c) =>
              c.businessId === businessId
                ? { ...c, items: c.items.filter((i) => !(i.groupId == null && i.productId === productId && i.unitId === unitId)) }
                : c
            )
            .filter((c) => c.items.length > 0),
        }));
      },

      setItemQuantity: (businessId, productId, unitId, quantity) => {
        const next = Math.max(1, Math.floor(quantity));
        set((state) => ({
          carts: state.carts.map((c) =>
            c.businessId === businessId
              ? { ...c, items: c.items.map((i) => (i.groupId == null && i.productId === productId && i.unitId === unitId ? { ...i, quantity: next } : i)) }
              : c
          ),
        }));
      },

      // SHF-13: mirrors the (now-fixed) backend subtractFromCart — reducing to zero drops
      // the line entirely rather than leaving a zero-quantity item behind.
      decrementItem: (businessId, productId, unitId) => {
        set((state) => ({
          carts: state.carts
            .map((c) =>
              c.businessId === businessId
                ? {
                    ...c,
                    items: c.items
                      .map((i) =>
                        i.groupId == null && i.productId === productId && i.unitId === unitId
                          ? { ...i, quantity: i.quantity - 1 }
                          : i
                      )
                      .filter((i) => i.quantity > 0),
                  }
                : c
            )
            .filter((c) => c.items.length > 0),
        }));
      },

      createGroup: (businessId, input) => {
        set((state) => {
          const cart = state.carts.find((c) => c.businessId === businessId) ?? { businessId, items: [], groups: [] };
          const groups = cart.groups ?? [];
          const group: GuestGroup = {
            id: newGroupId(),
            name: input.name?.trim() || nextSetName(groups),
            sets: input.sets,
          };
          const absorbed = new Set(input.items.map((i) => `${i.productId}:${i.unitId}`));
          const items = [
            ...(input.absorbLoose
              ? cart.items.filter((i) => i.groupId != null || !absorbed.has(`${i.productId}:${i.unitId}`))
              : cart.items),
            ...setLines(group, input),
          ];
          const next: GuestCart = { businessId, items, groups: [...groups, group] };
          const exists = state.carts.some((c) => c.businessId === businessId);
          return { carts: exists ? state.carts.map((c) => (c.businessId === businessId ? next : c)) : [...state.carts, next] };
        });
      },

      updateGroup: (businessId, groupId, input) => {
        set((state) => ({
          carts: state.carts.map((c) => {
            if (c.businessId !== businessId) return c;
            const groups = (c.groups ?? []).map((g) =>
              g.id === groupId ? { ...g, name: input.name?.trim() || g.name, sets: input.sets } : g
            );
            const group = groups.find((g) => g.id === groupId);
            if (!group) return c;
            return { ...c, groups, items: [...c.items.filter((i) => i.groupId !== groupId), ...setLines(group, input)] };
          }),
        }));
      },

      deleteGroup: (businessId, groupId, mode) => {
        set((state) => ({
          carts: state.carts
            .map((c) => {
              if (c.businessId !== businessId) return c;
              const members = c.items.filter((i) => i.groupId === groupId);
              let items = c.items.filter((i) => i.groupId !== groupId);
              if (mode === 'ungroup') {
                // Fold the members back into ordinary lines, merging with ones already there.
                for (const m of members) {
                  const line: GuestCartItem = { ...m };
                  delete line.groupId;
                  delete line.quantityPerSet;
                  const idx = items.findIndex((i) => i.groupId == null && i.productId === m.productId && i.unitId === m.unitId);
                  items =
                    idx === -1
                      ? [...items, line]
                      : items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + m.quantity } : i));
                }
              }
              return { ...c, items, groups: (c.groups ?? []).filter((g) => g.id !== groupId) };
            })
            .filter((c) => c.items.length > 0),
        }));
      },

      clearBusiness: (businessId) => {
        set((state) => ({ carts: state.carts.filter((c) => c.businessId !== businessId) }));
      },

      clearAll: () => set({ carts: [] }),

      getCart: (businessId) => get().carts.find((c) => c.businessId === businessId),

      getTotalItems: () =>
        get().carts.reduce((acc, cart) => acc + cart.items.reduce((a, i) => a + i.quantity, 0), 0),
    }),
    {
      name: 'mm-guest-cart',
    }
  )
);

/** Adapts a local guest cart into the same shape the server returns, so cart UI can render both identically. */
export function toCartResponse(cart: GuestCart): CartResponse {
  const products: CartProduct[] = cart.items.map((i) => ({
    productId: i.productId,
    name: i.name,
    type: i.type,
    image: i.image,
    unit: i.unit,
    unitId: i.unitId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.unitPrice * i.quantity,
    note: i.note,
    groupId: i.groupId ?? null,
    quantityPerSet: i.quantityPerSet ?? null,
  }));
  return {
    cartId: -1,
    businessId: cart.businessId,
    products,
    totalCost: products.reduce((acc, p) => acc + p.totalPrice, 0),
    groups: (cart.groups ?? []).map((g) => ({
      groupId: g.id,
      name: g.name,
      sets: g.sets,
      totalPrice: products.filter((p) => p.groupId === g.id).reduce((acc, p) => acc + p.totalPrice, 0),
    })),
  };
}
