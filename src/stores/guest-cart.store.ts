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
}

export interface GuestCart {
  businessId: number;
  items: GuestCartItem[];
}

interface GuestCartState {
  carts: GuestCart[];
  addItem: (businessId: number, item: Omit<GuestCartItem, 'quantity'> & { quantity: number }) => void;
  removeItem: (businessId: number, productId: number) => void;
  clearBusiness: (businessId: number) => void;
  clearAll: () => void;
  getCart: (businessId: number) => GuestCart | undefined;
  getTotalItems: () => number;
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
            (i) => i.productId === item.productId && i.unitId === item.unitId
          );
          const items =
            itemIndex === -1
              ? [...cart.items, item]
              : cart.items.map((i, idx) =>
                  idx === itemIndex ? { ...i, quantity: i.quantity + item.quantity } : i
                );
          const carts = [...state.carts];
          carts[cartIndex] = { ...cart, items };
          return { carts };
        });
      },

      removeItem: (businessId, productId) => {
        set((state) => ({
          carts: state.carts
            .map((c) =>
              c.businessId === businessId
                ? { ...c, items: c.items.filter((i) => i.productId !== productId) }
                : c
            )
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
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.unitPrice * i.quantity,
  }));
  return {
    cartId: -1,
    businessId: cart.businessId,
    products,
    totalCost: products.reduce((acc, p) => acc + p.totalPrice, 0),
  };
}
