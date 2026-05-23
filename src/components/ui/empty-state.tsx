import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'outline' | 'default' | 'ghost';
}

interface EmptyStateProps {
  /** Optional icon rendered in a tinted container */
  icon?: LucideIcon;
  /** Primary message */
  title: string;
  /** Secondary descriptive text */
  subtitle?: string;
  /** Optional call-to-action button */
  action?: EmptyStateAction;
  /** Extra classes on the wrapper */
  className?: string;
}

/**
 * Zero-data placeholder used whenever a list / table is empty.
 *
 * Usage:
 *   <EmptyState
 *     icon={ShoppingBag}
 *     title="No orders yet"
 *     subtitle="Orders will appear here once customers check out."
 *   />
 */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 space-y-3',
        className,
      )}
    >
      {Icon && (
        <div className="h-14 w-14 rounded-2xl bg-[#eff4ff] flex items-center justify-center mx-auto">
          <Icon className="h-7 w-7 text-[#0058be]" />
        </div>
      )}

      <div className="space-y-1">
        <p className="font-semibold text-[#091426]">{title}</p>
        {subtitle && (
          <p className="text-sm text-[#64748b] max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <Button
          variant={action.variant ?? 'outline'}
          size="sm"
          onClick={action.onClick}
          className="mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
