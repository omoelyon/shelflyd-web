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
      if (item.groupId != null) continue; // sets are sent as a unit below
      try {
        const updated = await cartApi.add({
          productId: item.productId,
          unitId: item.unitId,
          quantity: item.quantity,
          note: item.note,
        });
        useCartStore.getState().updateCart(updated);
      } catch {
        hadFailure = true;
      }
    }
    for (const group of cart.groups ?? []) {
      try {
        const updated = await cartApi.createGroup({
          businessId: cart.businessId,
          name: group.name,
          sets: group.sets,
          items: cart.items
            .filter((i) => i.groupId === group.id)
            .map((i) => ({ productId: i.productId, unitId: i.unitId, quantityPerSet: i.quantityPerSet ?? 1, note: i.note })),
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
