import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False on the server and while hydrating, true afterwards: for things that need `document.body`. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
