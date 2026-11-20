'use client';

import QuantityField from '@/components/ui/quantity-field';

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Used in the accessible names, e.g. "sets" -> "Decrease sets". */
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

/** − N + control used for set counts and per-set quantities: step with the buttons or type the number. */
export default function QtyStepper({ value, onChange, label, min = 1, max = 1000, disabled, className }: QtyStepperProps) {
  return <QuantityField size="sm" value={value} onChange={onChange} label={label} min={min} max={max} disabled={disabled} className={className} />;
}
