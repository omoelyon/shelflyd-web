import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ordersApi } from '@/lib/api/orders';
import { businessesApi } from '@/lib/api/businesses';
import { getApiError } from '@/lib/utils';

/** Re-adds every item from a past order to that business's cart, then sends the buyer there to check out. */
export function useReorder() {
  const router = useRouter();

  return useMutation({
    mutationFn: (orderId: number) => ordersApi.reorder(orderId),
    onSuccess: async (cart) => {
      toast.success('Added to your cart');
      try {
        const business = await businessesApi.getById(cart.businessId);
        router.push(`/storefront/${business.slug}/cart`);
      } catch {
        router.push('/cart');
      }
    },
    onError: (error) => toast.error(getApiError(error, 'Could not reorder — some items may no longer be available.')),
  });
}
