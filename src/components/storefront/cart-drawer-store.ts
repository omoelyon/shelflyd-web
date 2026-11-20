import { create } from 'zustand';

/** Whether the storefront's cart drawer is open (only used when the design's cart style is "drawer"). */
interface CartDrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCartDrawer = create<CartDrawerState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
