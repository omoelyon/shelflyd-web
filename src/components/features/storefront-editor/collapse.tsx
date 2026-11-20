'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** True when the person has asked their device for less motion. Only call from event handlers and effects. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Opens and closes its content with a smooth height + fade (CSS grid rows 0fr → 1fr, so no height measuring).
 * The content mounts the first time it opens and then stays mounted (hidden and inert while closed), so it can
 * keep its own state and doesn't pop in and out of the tab order.
 */
export function Collapse({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(open);
  // Start closed for one frame after mounting so opening actually animates.
  const [expanded, setExpanded] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setExpanded(open));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [open]);

  if (!mounted) return null;
  return (
    <div
      inert={!expanded}
      aria-hidden={!expanded || undefined}
      className={cn(
        'grid ease-(--ease-in-out) transition-[grid-template-rows,opacity] duration-300',
        expanded
          ? 'visible grid-rows-[1fr] opacity-100'
          : // Hide from layout and screen readers only after the collapse has finished.
            'invisible grid-rows-[0fr] opacity-0 [transition-delay:0s,0s,300ms] [transition-duration:300ms,300ms,0s] [transition-property:grid-template-rows,opacity,visibility]',
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * Lets a list row shrink and fade away before it is actually removed. `leave(key, then)` marks the row as leaving,
 * runs `then` (the real removal) once the animation is done, and removes at once when reduced motion is on.
 */
export function useLeaving<K>(ms = 240) {
  const [leaving, setLeaving] = useState<K | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const leave = (key: K, then: () => void) => {
    if (prefersReducedMotion()) {
      then();
      return;
    }
    clearTimeout(timer.current);
    setLeaving(key);
    timer.current = setTimeout(() => {
      then();
      setLeaving(null);
    }, ms);
  };
  return { leaving, leave };
}

/** Wraps one list row so it can collapse smoothly when `leaving`. Gives the row its spacing from the next one. */
export function Leaving({ leaving, children, className }: { leaving: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'group/leave grid ease-(--ease-in-out) transition-[grid-template-rows,opacity] duration-[240ms]',
        leaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        className,
      )}
    >
      <div className={cn('min-h-0 pb-2 group-last/leave:pb-0', leaving && 'overflow-hidden')}>{children}</div>
    </div>
  );
}
