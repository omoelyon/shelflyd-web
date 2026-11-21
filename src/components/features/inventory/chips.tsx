import { cn } from '@/lib/utils';
import type { CoverStatus, StockMovementType } from '@/types/inventory';
import { COVER_STATUS, MOVEMENT_TYPE } from './format';

const base = 'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset';

export function CoverStatusChip({ status, className }: { status: CoverStatus; className?: string }) {
  const meta = COVER_STATUS[status];
  return <span className={cn(base, meta.chip, className)}>{meta.label}</span>;
}

export function MovementTypeChip({ type, className }: { type: StockMovementType; className?: string }) {
  const meta = MOVEMENT_TYPE[type];
  return <span className={cn(base, meta.chip, className)}>{meta.label}</span>;
}

/** A small neutral tag, e.g. "Slow mover". */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(base, 'bg-slate-100 text-slate-600 ring-slate-200', className)}>{children}</span>;
}
