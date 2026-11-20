import { useState } from 'react';

/**
 * Counts how many times `value` has changed since this component first rendered: 0 on first render, then 1, 2…
 * Use it as a `key` (and to switch an animation class on) so something plays once per change but never on load.
 * While `enabled` is false changes are absorbed silently, and the moment it turns true the current value becomes
 * the baseline, so a value that only appears after hydration (a saved cart) doesn't pop on load.
 * Written as "adjust state while rendering", React's pattern for deriving state from props, so it needs no effect.
 */
export function useChangePulse(value: unknown, enabled = true): number {
  const [last, setLast] = useState(value);
  const [armed, setArmed] = useState(enabled);
  const [pulses, setPulses] = useState(0);
  if (enabled !== armed) {
    setArmed(enabled);
    setLast(value);
  } else if (!Object.is(last, value)) {
    setLast(value);
    if (enabled) setPulses((n) => n + 1);
  }
  return pulses;
}
