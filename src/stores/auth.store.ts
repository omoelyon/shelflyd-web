import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True once zustand's persist middleware has finished reading localStorage. Until
   * then, isAuthenticated is just its default (false) and must not be trusted — a
   * consumer that redirects on "not authenticated" before this flips true will bounce
   * an already-logged-in user on every hard page load. */
  hasHydrated: boolean;
  /** True once AuthHydrator's initial session check (real, server-verified — not just
   * the optimistic persisted hint) has concluded, success or failure. A consumer must
   * wait for this, not just hasHydrated, before trusting isAuthenticated/user for a
   * redirect decision. */
  authChecked: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  setAuthChecked: (value: boolean) => void;
}

// SHF-15: the session token itself lives only in the httpOnly cookie the backend already
// accepts (set via /api/auth/set-cookie, read automatically on every same-origin request —
// see apiClient) — it is never held here or in localStorage, so it can't be read or
// exfiltrated by injected JS. What's persisted below is only a non-sensitive "was logged
// in" hint used to avoid a flash of logged-out UI while the real check is in flight; the
// hint is never trusted on its own — every protected read still checks the cookie server-side.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      authChecked: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
      setAuthChecked: (value) => set({ authChecked: value }),
    }),
    {
      name: 'mm-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
