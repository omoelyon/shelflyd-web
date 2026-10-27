'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { usersApi } from '@/lib/api/users';

/**
 * SHF-15: determines "am I logged in?" by asking the backend (cookie-authenticated),
 * not by reading a token out of localStorage — there is no token on this side anymore.
 * The persisted isAuthenticated hint is used only to skip this network call entirely for
 * a definitely-anonymous visitor (never logged in on this browser); it's never trusted on
 * its own, so a stale/expired session still gets corrected here the moment it's checked.
 */
export default function AuthHydrator() {
  const { hasHydrated, isAuthenticated, setUser, logout, setAuthChecked } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const previousUserId = useRef<number | null>(null);

  // Everything in the query cache belongs to whoever was signed in. When that changes — a
  // sign-out, or a different account signing in on the same browser — drop it all, so the new
  // session can never briefly show the previous person's store, orders or earnings.
  useEffect(() => {
    if (previousUserId.current !== null && previousUserId.current !== userId) {
      queryClient.clear();
    }
    previousUserId.current = userId;
  }, [userId, queryClient]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      setAuthChecked(true);
      return;
    }
    usersApi
      .me()
      .then((user) => setUser(user))
      .catch(() => logout())
      .finally(() => setAuthChecked(true));
    // Only re-run if hydration itself changes — this is a one-shot check per app load,
    // not something that should re-fire on every isAuthenticated flip it causes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  return null;
}
