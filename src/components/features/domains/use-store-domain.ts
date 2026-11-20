import { useQuery } from '@tanstack/react-query';
import { domainsApi } from '@/lib/api/domains';

export const DOMAIN_QUERY_KEY = ['business-domain'] as const;

/** The seller's domain state, shared by the settings card, the domain page and the storefront editor. */
export function useDomainState() {
  return useQuery({
    queryKey: DOMAIN_QUERY_KEY,
    queryFn: domainsApi.getState,
    staleTime: 60_000,
    // Where custom domains are off or the call fails, everything simply behaves as if there is no domain.
    retry: false,
    // While a domain is still being set up, look again every 30 seconds so the page notices when it goes live.
    refetchInterval: (query) => {
      const domain = query.state.data?.domain;
      return domain && domain.status !== 'ACTIVE' ? 30_000 : false;
    },
  });
}

/** The store's live custom domain (e.g. "shop.theirbrand.com"), or null when it only has its Shelflyd address. */
export function useStoreDomain(): string | null {
  const { data } = useDomainState();
  return data?.enabled && data.domain?.status === 'ACTIVE' ? data.domain.hostname : null;
}
