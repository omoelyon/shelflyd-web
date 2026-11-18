'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Used in the buttons' accessible names, e.g. "sets" -> "Decrease sets". */
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

/** − N + control used for set counts and per-set quantities. */
export default function QtyStepper({ value, onChange, label, min = 1, max = 1000, disabled, className }: QtyStepperProps) {
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="min-w-7 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
