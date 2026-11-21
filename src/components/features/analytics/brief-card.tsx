'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Mail, Minus, Newspaper, PackageX, ShoppingBag, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { insightsApi } from '@/lib/api/insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn, getApiError } from '@/lib/utils';
import type { Brief, BriefFigure, BriefRunningOut } from '@/types/insights';
import { naira, pct } from './insights-format';

/** Up/down against the same weekday last week. Revenue and orders: more is better. */
function Change({ figure }: { figure: BriefFigure }) {
  if (figure.changePct == null) {
    return figure.value > 0 ? (
      <span className="rounded-full bg-[#eff4ff] px-2 py-0.5 text-xs font-semibold text-[#0058be]">New</span>
    ) : null;
  }
  if (Math.round(Math.abs(figure.changePct) * 10) === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#64748b]">
        <Minus className="h-3 w-3" aria-hidden="true" />
        Same
      </span>
    );
  }
  const up = figure.changePct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        up ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]',
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">{up ? 'Up ' : 'Down '}</span>
      {pct(figure.changePct)}
    </span>
  );
}

function Tile({ label, figure, money }: { label: string; figure: BriefFigure; money?: boolean }) {
  const fmt = (n: number) => (money ? naira(n) : n.toLocaleString('en-NG'));
  return (
    <div className="rounded-xl bg-[#f8f9ff] p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">{label}</p>
      <p className="mt-0.5 font-heading text-xl font-bold tabular-nums text-[#091426]">{fmt(figure.value)}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Change figure={figure} />
        <span className="text-xs text-[#64748b]">vs {fmt(figure.sameWeekdayLastWeek)} same day last week</span>
      </div>
    </div>
  );
}

function ActionLink({ href, tone, children }: { href: string; tone: 'amber' | 'red'; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
        tone === 'amber'
          ? 'bg-amber-50 text-amber-900 hover:bg-amber-100 focus-visible:ring-amber-400'
          : 'bg-[#fef2f2] text-[#b91c1c] hover:bg-[#fee2e2] focus-visible:ring-red-400',
      )}
    >
      {children}
    </Link>
  );
}

function leftText(item: BriefRunningOut): string {
  if (item.daysOfCover == null) return 'running low';
  if (item.daysOfCover < 1) return 'runs out today';
  const days = Math.round(item.daysOfCover);
  return days === 1 ? 'about 1 day left' : `about ${days} days left`;
}

/** Whether there is anything worth showing: a brand-new store with no orders and nothing to do gets no card. */
function hasContent(b: Brief): boolean {
  const n = b.needsAction;
  return (
    b.revenue.value > 0 ||
    b.orders.value > 0 ||
    b.revenue.sameWeekdayLastWeek > 0 ||
    b.orders.sameWeekdayLastWeek > 0 ||
    n.ordersToProcess + n.ordersReadyToDispatch + n.outOfStock + n.lowStock > 0 ||
    b.runningOut.length > 0 ||
    b.highlights.length > 0
  );
}

function EmailSwitch() {
  const qc = useQueryClient();
  // Team members may not be allowed to read or change this: an error simply hides the switch.
  const { data } = useQuery({ queryKey: ['daily-brief-setting'], queryFn: insightsApi.getBriefSetting, retry: false });
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => insightsApi.setBriefSetting(enabled),
    onSuccess: (saved) => {
      qc.setQueryData(['daily-brief-setting'], saved);
      toast.success(saved.enabled ? 'We’ll email you this every morning.' : 'Morning emails are off.');
    },
    onError: (error) => {
      toast.error(getApiError(error, 'Could not change the morning email.'));
      qc.invalidateQueries({ queryKey: ['daily-brief-setting'] });
    },
  });
  if (!data) return null;
  const checked = mutation.isPending ? (mutation.variables ?? data.enabled) : data.enabled;
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#64748b]">
      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Email me this every morning</span>
      <Switch size="sm" checked={checked} disabled={mutation.isPending} onCheckedChange={(next) => mutation.mutate(next)} aria-label="Email me this every morning" />
    </label>
  );
}

/** Yesterday at a glance for the Overview: the numbers against the same weekday last week, what needs doing, and what is running out. */
export default function BriefCard() {
  // An error (older backend, no business yet) simply hides the card.
  const { data: brief, isLoading, isError } = useQuery({ queryKey: ['daily-brief'], queryFn: insightsApi.getBrief, retry: false, staleTime: 5 * 60_000 });

  if (isLoading) return <Skeleton className="h-56 rounded-2xl" />;
  if (isError || !brief || !hasContent(brief)) return null;

  const n = brief.needsAction;
  const hasActions = n.ordersToProcess + n.ordersReadyToDispatch + n.outOfStock + n.lowStock > 0;
  // The email has no action chips, so the server also writes "N orders are waiting to be prepared" and "N products are
  // out of stock" as highlights. Here the chips above already say that, so those two lines are left out.
  const highlights = brief.highlights.filter(
    (h) => !(n.ordersToProcess > 0 && h.endsWith('waiting to be prepared.')) && !(n.outOfStock > 0 && h.endsWith('out of stock.')),
  );
  let dateLabel = 'Yesterday';
  try {
    dateLabel = `Yesterday, ${format(parseISO(brief.date), 'EEE d MMM')}`;
  } catch {
    // keep the plain label
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card-md" aria-labelledby="daily-brief-title">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff4ff]" aria-hidden="true">
            <Newspaper className="h-[18px] w-[18px] text-[#0058be]" />
          </span>
          <div>
            <h2 id="daily-brief-title" className="font-heading text-sm font-bold text-[#091426]">
              Your daily brief
            </h2>
            <p className="text-xs text-[#64748b]">{dateLabel}</p>
          </div>
        </div>
        <EmailSwitch />
      </div>

      {brief.headline && <p className="mt-4 text-[15px] font-semibold leading-snug text-[#091426]">{brief.headline}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Tile label="Revenue" figure={brief.revenue} money />
        <Tile label="Orders" figure={brief.orders} />
      </div>

      {hasActions && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Needs your attention">
          {n.ordersToProcess > 0 && (
            <ActionLink href="/dashboard/orders" tone="amber">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              {n.ordersToProcess} {n.ordersToProcess === 1 ? 'order' : 'orders'} to prepare
            </ActionLink>
          )}
          {n.ordersReadyToDispatch > 0 && (
            <ActionLink href="/dashboard/orders" tone="amber">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              {n.ordersReadyToDispatch} ready to dispatch
            </ActionLink>
          )}
          {n.outOfStock > 0 && (
            <ActionLink href="/dashboard/inventory" tone="red">
              <PackageX className="h-3.5 w-3.5" aria-hidden="true" />
              {n.outOfStock} out of stock
            </ActionLink>
          )}
          {n.lowStock > 0 && (
            <ActionLink href="/dashboard/inventory" tone="amber">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {n.lowStock} running low
            </ActionLink>
          )}
        </div>
      )}

      {(brief.runningOut.length > 0 || highlights.length > 0 || brief.topProduct) && (
        <div className="mt-4 grid gap-5 border-t border-[#f1f5f9] pt-4 md:grid-cols-2">
          {brief.runningOut.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Running out</h3>
                <Link href="/dashboard/inventory" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0058be] hover:underline">
                  See stock <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
              <ul className="space-y-1.5">
                {brief.runningOut.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-[#091426]">{item.name}</span>
                    <span className="shrink-0 text-xs text-[#64748b]">
                      {leftText(item)} · {item.onHand.toLocaleString('en-NG', { maximumFractionDigits: 1 })} {item.baseUnit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(highlights.length > 0 || brief.topProduct) && (
            <div>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Worth knowing</h3>
              <ul className="space-y-1.5">
                {/* The highlights usually say this already; only add the line when they don't. */}
                {brief.topProduct && !highlights.some((h) => h.includes(brief.topProduct!.name)) && (
                  <li className="flex gap-2 text-sm leading-relaxed text-[#091426]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058be]" aria-hidden="true" />
                    <span>
                      Best seller: <span className="font-semibold">{brief.topProduct.name}</span>
                      {brief.topProduct.revenue != null && ` (${naira(brief.topProduct.revenue)})`}
                    </span>
                  </li>
                )}
                {highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm leading-relaxed text-[#091426]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058be]" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
