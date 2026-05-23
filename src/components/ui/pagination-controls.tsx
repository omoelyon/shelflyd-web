import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  /** Zero-based current page index */
  page: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

/**
 * Prev / Next pagination bar.
 * Returns null when there is only one page.
 *
 * Usage:
 *   <PaginationControls
 *     page={page}
 *     totalPages={data.totalPages}
 *     isFirst={data.first}
 *     isLast={data.last}
 *     onPrev={() => setPage((p) => p - 1)}
 *     onNext={() => setPage((p) => p + 1)}
 *   />
 */
export default function PaginationControls({
  page,
  totalPages,
  isFirst,
  isLast,
  onPrev,
  onNext,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <Button variant="outline" size="sm" disabled={isFirst} onClick={onPrev}>
        Previous
      </Button>
      <span className="text-sm text-[#64748b] tabular-nums">
        Page {page + 1} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={isLast} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}
