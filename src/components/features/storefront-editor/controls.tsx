'use client';

import { useId, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** A titled group of controls in the editor's left column. */
export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** A label, the control, and optional helper text; the control gets the label's id so clicking the label focuses it. */
export function Field({
  label,
  hint,
  counter,
  children,
}: {
  label: string;
  hint?: string;
  /** e.g. "12/80", shown right of the label. */
  counter?: string;
  children: ReactNode | ((id: string) => ReactNode);
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {counter && <span className="text-[11px] tabular-nums text-muted-foreground">{counter}</span>}
      </div>
      {typeof children === 'function' ? children(id) : children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export interface Option<T extends string | number> {
  value: T;
  label: string;
  /** Rendered inside the button instead of the label (e.g. a font sample). */
  render?: ReactNode;
  hint?: string;
}

/** A row of mutually exclusive choices, announced to screen readers as a radio group. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid gap-1.5', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg border px-2 py-2 text-center text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              selected ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary' : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {o.render ?? o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A labelled on/off row. */
export function ToggleRow({ label, hint, control }: { label: string; hint?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {control}
    </div>
  );
}
