'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Fades a section up as it scrolls into view. Safe by construction:
 *  - The markup is always visible. Nothing is hidden until this effect runs after hydration, so with JavaScript off
 *    (or before it loads) the page is complete, and there is no flash of hidden content on first paint.
 *  - Anything already on screen (or above it, after a scroll restore) is left alone: it is never hidden and
 *    then shown again.
 *  - Only below-the-fold sections are armed. They are hidden with opacity/transform only (layout is unchanged,
 *    so nothing shifts), and revealed once, the first time they come within reach.
 * The classes are toggled on the element directly instead of through React state, so a re-render (new products,
 * a category filter) can never re-hide a section that has already been revealed.
 */
export default function Reveal({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already in view: stay visible

    el.classList.add('is-armed');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove('is-armed', 'is-in');
    };
  }, [disabled]);

  return (
    <div ref={ref} className="sf-reveal">
      {children}
    </div>
  );
}
