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
  const { isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: ['business-profile'],
    queryFn: businessesApi.getProfile,
    enabled: isAuthenticated,
    retry: false,
    // A 404 here just means "this user has no business" — an expected, common
    // outcome for buyers, not a failure worth surfacing as an error toast.
    meta: { silentError: true },
  });

  return {
    business: query.data,
    hasBusiness: !!query.data,
    isChecking: isAuthenticated && query.isLoading,
  };
}
