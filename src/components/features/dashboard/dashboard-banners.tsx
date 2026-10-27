'use client';

import Link from 'next/link';
import { CalendarClock, Landmark } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PayoutAccount, Subscription } from '@/types';

type Tone = 'red' | 'amber';

function Banner({
  tone,
  icon: Icon,
  title,
  detail,
  href,
  cta,
}: {
  tone: Tone;
  icon: typeof CalendarClock;
  title: string;
  detail: string;
  href: string;
  cta: string;
}) {
  const red = tone === 'red';
  return (
    <div
      role={red ? 'alert' : 'status'}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl border',
        red ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
      )}
    >
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', red ? 'bg-red-100' : 'bg-amber-100')} aria-hidden="true">
        <Icon className={cn('h-5 w-5', red ? 'text-red-700' : 'text-amber-700')} />
      </div>
      <p className={cn('flex-1 text-sm', red ? 'text-red-900' : 'text-amber-900')}>
        <span className="font-semibold">{title}</span>
        {detail}
      </p>
      <Link
        href={href}
        className={cn(buttonVariants({ size: 'sm' }), 'shrink-0 bg-[#091426] text-white hover:bg-[#091426]/90')}
      >
        {cta}
      </Link>
    </div>
  );
}

/** The most urgent item on the dashboard: a trial or plan running out, in grace, or lapsed. */
export function SubscriptionBanner({ subscription }: { subscription?: Subscription }) {
  if (!subscription) return null;
  const graceEnds = new Date(subscription.graceEndsAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const days = `${subscription.daysLeft} day${subscription.daysLeft === 1 ? '' : 's'}`;
  const href = '/dashboard/settings/subscription';

  if (subscription.state === 'LAPSED') {
    return <Banner tone="red" icon={CalendarClock} title="Your storefront is hidden" detail=" — renew to start taking orders again." href={href} cta="Renew now" />;
  }
  if (subscription.state === 'GRACE') {
    return <Banner tone="red" icon={CalendarClock} title="Your subscription has ended" detail={` — pay by ${graceEnds} or your storefront will be hidden.`} href={href} cta="Pay now" />;
  }
  if (subscription.daysLeft <= 3 && !subscription.autoRenew) {
    return subscription.state === 'TRIAL' ? (
      <Banner tone="amber" icon={CalendarClock} title={`Your free trial ends in ${days}`} detail=" — add a card or pay to keep your store live." href={href} cta="Manage plan" />
    ) : (
      <Banner tone="amber" icon={CalendarClock} title={`Your plan ends in ${days}`} detail="" href={href} cta="Manage plan" />
    );
  }
  return null;
}

/**
 * Fallback only: while the setup checklist is on screen it already asks for the payout account,
 * so this appears just when the checklist is hidden but payout still isn't configured.
 */
export function PayoutReminder({ payoutAccount }: { payoutAccount?: PayoutAccount }) {
  if (!payoutAccount || payoutAccount.configured) return null;
  return (
    <Banner
      tone="amber"
      icon={Landmark}
      title="Add your payout account to start receiving payments"
      detail=" — customers can't check out until you do."
      href="/dashboard/settings/payout"
      cta="Add account"
    />
  );
}
