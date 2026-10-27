'use client';

import Link from 'next/link';
import { Check, Package, Landmark, MapPin, Image as ImageIcon, Store, type LucideIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SetupStatus, SetupStepKey } from '@/types';

interface StepCopy {
  icon: LucideIcon;
  title: string;
  reason: string;
  cta: string;
  href: string;
}

const STEP_COPY: Record<SetupStepKey, StepCopy> = {
  store: {
    icon: Store,
    title: 'Create your store',
    reason: 'Your storefront is live at its own link.',
    cta: 'View store',
    href: '/dashboard/settings',
  },
  product: {
    icon: Package,
    title: 'Add your first product',
    reason: 'Customers need something to buy.',
    cta: 'Add product',
    href: '/dashboard/products/new',
  },
  payout: {
    icon: Landmark,
    title: 'Add your payout account',
    reason: "Needed before customers can pay you. We'll send your earnings here.",
    cta: 'Add account',
    href: '/dashboard/settings/payout',
  },
  pickup: {
    icon: MapPin,
    title: 'Set your pickup address',
    reason: 'Shown to buyers who collect in person.',
    cta: 'Set address',
    href: '/dashboard/settings/delivery',
  },
  logo: {
    icon: ImageIcon,
    title: 'Add a logo',
    reason: 'Optional, but stores with a logo look more trusted.',
    cta: 'Upload logo',
    href: '/dashboard/settings',
  },
};

const ORDER: SetupStepKey[] = ['store', 'product', 'payout', 'pickup', 'logo'];

export function SetupChecklistSkeleton() {
  return <Skeleton className="h-[22rem] rounded-2xl" />;
}

/** Guides a new seller to their first sale. Renders nothing once every step is done. */
export default function SetupChecklist({ status }: { status: SetupStatus }) {
  if (status.completed >= status.total) return null;

  const percent = Math.round((status.completed / Math.max(status.total, 1)) * 100);
  const steps = ORDER.map((key) => status.steps.find((s) => s.key === key)).filter(
    (s): s is NonNullable<typeof s> => !!s,
  );

  return (
    <section aria-labelledby="setup-heading" className="bg-white rounded-2xl shadow-card-md p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="setup-heading" className="font-bold text-base text-[#091426] font-heading">
          Get your store ready
        </h2>
        <p className="text-xs font-medium text-[#64748b] shrink-0">
          {status.completed} of {status.total} done
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Store setup progress"
        className="mt-3 h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden"
      >
        <div className="h-full rounded-full bg-[#0058be] transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-2 divide-y divide-[#f1f5f9]">
        {steps.map((step) => {
          const copy = STEP_COPY[step.key];
          const Icon = copy.icon;
          return (
            <li key={step.key} className="flex items-center gap-3 py-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-[#eff4ff] text-[#0058be]',
                )}
                aria-hidden="true"
              >
                {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', step.done ? 'text-[#64748b]' : 'font-semibold text-[#091426]')}>
                  {copy.title}
                  {step.done && <span className="sr-only"> (done)</span>}
                </p>
                {!step.done && <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{copy.reason}</p>}
              </div>

              {!step.done && (
                <Link
                  href={copy.href}
                  aria-label={`${copy.cta}: ${copy.title}`}
                  className={cn(
                    buttonVariants({ size: 'sm', variant: step.required ? 'default' : 'outline' }),
                    'shrink-0 h-8 px-3',
                    step.required && 'bg-[#0058be] text-white hover:bg-[#0058be]/90',
                  )}
                >
                  {copy.cta}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
