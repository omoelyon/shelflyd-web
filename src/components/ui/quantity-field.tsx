'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuantityFieldProps {
  value: number;
  onChange: (value: number) => void;
  /** Used in the accessible names: "Quantity", "Decrease quantity", "Increase quantity". */
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** `sm` is the compact version used inside cards and dialogs. */
  size?: 'md' | 'sm';
  /**
   * True (default): every typed number is reported at once, for a quantity that only feeds a form.
   * False: typing is reported only when the shopper leaves the box or presses Enter, for a quantity that
   * saves something each time it changes (a cart line), so typing "12" is one update, not two.
   */
  live?: boolean;
  /** With `live={false}`: true while the reported change is being saved, so the box keeps showing what was typed instead of flicking back. */
  pending?: boolean;
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * − [ N ] + : a quantity the shopper can step with the buttons or simply type. While typing, the box may be empty or
 * half-finished; the number is kept in range and tidied up when they leave the box. The arrow keys step too.
 */
export default function QuantityField({ value, onChange, label = 'quantity', min = 1, max = 100_000, disabled, size = 'md', live = true, pending = false, className }: QuantityFieldProps) {
  // What the shopper has typed. It only counts for the value it was typed against, so once the value changes underneath
  // (a button press, or the server answering) the box shows the value again.
  const [edit, setEdit] = useState<{ text: string; base: number; focused: boolean } | null>(null);
  const active = edit && edit.base === value && (edit.focused || pending) ? edit : null;
  const shown = active ? active.text : String(value);

  const sm = size === 'sm';
  const step = (delta: number) => onChange(clamp(value + delta, min, max));

  const commit = () => {
    const parsed = parseInt(shown, 10);
    const next = Number.isFinite(parsed) ? clamp(parsed, min, max) : min;
    if (next !== value) {
      setEdit({ text: String(next), base: value, focused: false });
      onChange(next);
    } else {
      setEdit(null);
    }
  };

  return (
    <div className={cn('inline-flex items-center', sm ? 'gap-1' : 'gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn('active:scale-90', sm && 'h-7 w-7')}
        aria-label={`Decrease ${label}`}
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
      >
        <Minus className={sm ? 'h-3 w-3' : 'h-4 w-4'} />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={label.charAt(0).toUpperCase() + label.slice(1)}
        value={shown}
        disabled={disabled}
        onFocus={(e) => {
          setEdit({ text: String(value), base: value, focused: true });
          e.currentTarget.select();
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, String(max).length);
          setEdit({ text: digits, base: value, focused: true });
          const parsed = parseInt(digits, 10);
          if (live && Number.isFinite(parsed)) onChange(clamp(parsed, min, max));
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const typed = parseInt(shown, 10);
            const next = clamp((Number.isFinite(typed) ? typed : value) + (e.key === 'ArrowUp' ? 1 : -1), min, max);
            setEdit({ text: String(next), base: value, focused: true });
            if (live) onChange(next);
          }
        }}
        className={cn(
          'rounded-lg border border-input bg-background text-center font-medium tabular-nums outline-none transition-[border-color,box-shadow] duration-200 ease-(--ease-out) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
          sm ? 'h-7 w-10 text-sm' : 'h-10 w-16 text-base',
        )}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn('active:scale-90', sm && 'h-7 w-7')}
        aria-label={`Increase ${label}`}
        onClick={() => step(1)}
        disabled={disabled || value >= max}
      >
        <Plus className={sm ? 'h-3 w-3' : 'h-4 w-4'} />
      </Button>
    </div>
  );
}
