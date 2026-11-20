import type { CSSProperties } from 'react';

/** Inline style that places an element at position `i` in a staggered entrance (see `.sf-rise` / `.sf-fade-in` in globals.css). */
export const stagger = (i: number): CSSProperties => ({ '--sf-i': i }) as CSSProperties;
