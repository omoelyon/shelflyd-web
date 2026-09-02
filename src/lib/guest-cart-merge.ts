import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';

/**
 * Pushes any locally-held guest cart items into the user's real server cart
 * right after they authenticate, then clears the local copy. Called from the
 * login/register success handlers.
 */
export async function mergeGuestCartIntoServer(): Promise<void> {
  const guestCarts = useGuestCartStore.getState().carts;
  if (guestCarts.length === 0) return;

  let hadFailure = false;
  for (const cart of guestCarts) {
    for (const item of cart.items) {
      try {
        const updated = await cartApi.add({
          productId: item.productId,
          unitId: item.unitId,
          quantity: item.quantity,
        });
        useCartStore.getState().updateCart(updated);
      } catch {
        hadFailure = true;
      }
    }
  }
  useGuestCartStore.getState().clearAll();

  if (hadFailure) {
    const { toast } = await import('sonner');
    toast.error('Some items from your cart could not be added — please double-check your cart.');
  }
}
