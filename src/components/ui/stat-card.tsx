import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Icon fill colour (e.g. '#0058be') */
  accent?: string;
  /** Icon container background (e.g. '#eff4ff') */
  bg?: string;
  /** 'md' is the default dashboard bento size; 'sm' is compact */
  size?: 'sm' | 'md';
  /** Extra wrapper classes */
  className?: string;
}

/**
 * KPI / statistics card. Used in dashboard overview and landing stats bar.
 *
 * Usage:
 *   <StatCard icon={ShoppingBag} label="Total Orders" value={42} accent="#0058be" bg="#eff4ff" />
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = '#0058be',
  bg = '#eff4ff',
  size = 'md',
  className,
}: StatCardProps) {
  const isMd = size === 'md';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-card-md flex items-center',
        isMd ? 'p-4 gap-3.5' : 'p-3 gap-3',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-xl flex items-center justify-center shrink-0',
          isMd ? 'h-10 w-10' : 'h-8 w-8',
        )}
        style={{ backgroundColor: bg }}
      >
        <Icon
          className={isMd ? 'h-5 w-5' : 'h-4 w-4'}
          style={{ color: accent }}
        />
      </div>

      <div>
        <p
          className={cn(
            'font-bold text-[#091426] font-heading leading-none',
            isMd ? 'text-2xl' : 'text-xl',
          )}
        >
          {value}
        </p>
        <p className="text-xs text-[#64748b] leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  );
}
