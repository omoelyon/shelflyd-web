'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';
import AuthHydrator from './auth-hydrator';
import SetsVariantBadge from './features/cart-sets/sets-variant-badge';
import { getApiError } from '@/lib/utils';
import { isAxiosError } from 'axios';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silentError) return;
            // A store that doesn't exist gets its own "This store isn't available" page; its sections (products,
            // categories…) would otherwise each add a "Business not found" toast on top of it.
            if (query.queryKey[0] === 'storefront' && isAxiosError(error) && error.response?.status === 404) return;
            toast.error(getApiError(error, 'Something went wrong.'));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthHydrator />
        {children}
        {/* Bottom, so a toast never covers the header (cart, sign in) right where people look next; lifted on phones to clear the dashboard tab bar. */}
        <Toaster richColors position="bottom-right" mobileOffset={{ bottom: 104 }} />
        <SetsVariantBadge />
      </TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
