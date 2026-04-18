import { create } from 'zustand';
import type { CartResponse } from '@/types';

interface CartState {
  carts: CartResponse[];
  setCarts: (carts: CartResponse[]) => void;
  updateCart: (cart: CartResponse) => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  carts: [],

  setCarts: (carts) => set({ carts }),

  updateCart: (cart) => {
    set((state) => {
      const exists = state.carts.find((c) => c.cartId === cart.cartId);
      if (exists) {
        return { carts: state.carts.map((c) => (c.cartId === cart.cartId ? cart : c)) };
      }
      return { carts: [...state.carts, cart] };
    });
  },

  getTotalItems: () => {
    return get().carts.reduce(
      (acc, cart) => acc + cart.products.reduce((a, p) => a + p.quantity, 0),
      0
    );
  },
}));
