import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  /** True once zustand's persist middleware has finished reading localStorage. Until
   * then, isAuthenticated is just its default (false) and must not be trusted — a
   * consumer that redirects on "not authenticated" before this flips true will bounce
   * an already-logged-in user on every hard page load. */
  hasHydrated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setToken: (token) => {
        localStorage.setItem('mm_token', token);
        set({ token, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('mm_token');
        set({ token: null, user: null, isAuthenticated: false });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'mm-auth',
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
