'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isValidPeriod, periodFor, PERIOD_OPTIONS, type Period, type PeriodKey } from './periods';

interface PeriodPickerProps {
  value: Period;
  onChange: (period: Period) => void;
  /** Distinguishes the date fields when more than one picker is on a page. */
  idPrefix?: string;
  className?: string;
}

/** Preset period pills (This month, Last month, …) plus a custom from/to range. */
export default function PeriodPicker({ value, onChange, idPrefix = 'period', className }: PeriodPickerProps) {
  const valid = isValidPeriod(value);

  const choose = (key: PeriodKey) => {
    // Switching to "Custom" starts from the range that was showing, so nothing jumps.
    onChange(key === 'custom' ? { key, from: value.from, to: value.to } : periodFor(key));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#f8f9ff] p-1 w-fit max-w-full" role="group" aria-label="Period">
        {PERIOD_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={value.key === key}
            onClick={() => choose(key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
              value.key === key ? 'bg-[#091426] text-white shadow-sm' : 'text-[#64748b] hover:text-[#091426]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {value.key === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-from`} className="text-xs text-[#64748b]">
              From
            </Label>
            <Input
              id={`${idPrefix}-from`}
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => onChange({ key: 'custom', from: e.target.value, to: value.to })}
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-to`} className="text-xs text-[#64748b]">
              To
            </Label>
            <Input
              id={`${idPrefix}-to`}
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => onChange({ key: 'custom', from: value.from, to: e.target.value })}
              className="h-9 w-40"
            />
          </div>
          {!valid && (
            <p role="alert" className="pb-2 text-xs text-destructive">
              Choose a start date that is not after the end date.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
