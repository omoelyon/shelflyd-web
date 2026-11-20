import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False while rendering on the server and during hydration, true afterwards, so client-only state (saved carts, sign-in hints) can be shown without a mismatch. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
