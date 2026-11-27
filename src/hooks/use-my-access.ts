import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { useAuthStore } from '@/stores/auth.store';
import type { Permission } from '@/types/team';

/**
 * What the signed-in person may do for their business: the owner can do everything, a team member what their role
 * allows. Used to hide what they can't use; the server enforces the same rules either way.
 */
export function useMyAccess() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const query = useQuery({
    queryKey: ['my-access'],
    queryFn: teamsApi.me,
    enabled: hasHydrated && isAuthenticated,
    retry: false,
    staleTime: 60_000,
    meta: { silentError: true },
  });
  const access = query.data;
  return {
    access,
    loading: query.isLoading,
    isOwner: !!access?.owner,
    /** True when they have any of the given permissions. While loading this is false, so nothing flashes then hides. */
    can: (...perms: Permission[]) => !!access && (access.owner || perms.some((p) => access.permissions.includes(p))),
  };
}
