import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Main heading */
  title: string;
  /** Subtitle / description shown below the title */
  subtitle?: string;
  /** Optional badge or chip rendered next to the title */
  badge?: ReactNode;
  /** Action slot — rendered flush right (e.g. a Button) */
  action?: ReactNode;
  className?: string;
}

/**
 * Consistent page-level header used across all dashboard and public pages.
 * Replaces ad-hoc `<div className="flex items-center justify-between">` blocks.
 */
export default function PageHeader({
  title,
  subtitle,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-[#091426] font-heading leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[#64748b] text-sm mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
