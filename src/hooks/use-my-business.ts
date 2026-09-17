import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Resolves whether the current user owns or belongs to a business (as owner
 * or active team member). A 404 from GET /business/profile means "no
 * business" — that's an expected outcome here, not a transient failure, so
 * this never retries.
 */
export function useMyBusiness() {
  const { isAuthenticated, hasHydrated } = useAuthStore();

  const query = useQuery({
    queryKey: ['business-profile'],
    // Wait for the persisted auth state to load before deciding whether to fetch —
    // otherwise a hard reload briefly sees isAuthenticated's default (false) and
    // concludes "no business" before the real token is even read from storage.
    queryFn: businessesApi.getProfile,
    enabled: hasHydrated && isAuthenticated,
    retry: false,
    // A 404 here just means "this user has no business" — an expected, common
    // outcome for buyers, not a failure worth surfacing as an error toast.
    meta: { silentError: true },
  });

  return {
    business: query.data,
    hasBusiness: !!query.data,
    isChecking: !hasHydrated || (isAuthenticated && query.isLoading),
  };
}
