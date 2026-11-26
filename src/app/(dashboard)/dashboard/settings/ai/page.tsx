'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Lock, MessageSquare, Sparkles, Store } from 'lucide-react';
import { cn, getApiError } from '@/lib/utils';
import { businessesApi } from '@/lib/api/businesses';
import { useAuthStore } from '@/stores/auth.store';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sellerAssistantApi } from '@/lib/api/assistant';
import { formatMoney } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import AssistantSettingsCard from '@/components/features/assistant/assistant-settings-card';

const ASSISTANT_NAME: Record<string, { label: string; hint: string; icon: typeof Store }> = {
  shopper: { label: 'Store assistant', hint: 'Shoppers chatting on your store', icon: Store },
  seller: { label: 'Business assistant', hint: 'You and your team in the dashboard', icon: MessageSquare },
};

const CREDIT_LABEL: Record<string, string> = { MONTHLY_FREE: 'Free monthly credit', TOP_UP: 'Top-up', ADJUSTMENT: 'Adjustment' };

const PACKS = [2000, 5000, 10000, 25000];

/** What the AI assistants cost this business: credit left, this month's spend, per assistant and per day. */
export default function AiUsagePage() {
  return (
    <Suspense>
      <AiUsage />
    </Suspense>
  );
}

function AiUsage() {
  const { data, isLoading } = useQuery({ queryKey: ['ai-usage', 30], queryFn: () => sellerAssistantApi.usage(30) });
  useSettleReturn();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/dashboard/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#091426]">
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#091426]" style={{ fontFamily: 'var(--font-manrope)' }}>
          AI assistant &amp; credit
        </h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Your store assistant and business assistant run on AI credit. Each reply uses a little, depending on how long the conversation is.
        </p>
      </div>

      <AssistantSettingsCard />

      <BuyCredit rate={data?.nairaPerMillionTokens} />

      {isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Credit left" value={formatMoney(data.balance)} hint={data.billingEnforced ? 'Assistants pause at ₦0' : 'Not limited right now'} strong />
            <Stat label="Spent this month" value={formatMoney(data.monthSpend)} hint={data.monthlyFree > 0 ? `You get ${formatMoney(data.monthlyFree)} free each month` : 'Billed separately from your plan'} />
            <Stat label="AI replies this month" value={data.monthCalls.toLocaleString('en-NG')} hint="Each model call counts once" />
          </div>

          <section className="rounded-2xl bg-white p-5 shadow-card-md">
            <h3 className="text-sm font-semibold text-[#091426]">Last 30 days</h3>
            <p className="text-xs text-[#64748b]">Credit used per day, by assistant.</p>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily.map((d) => ({ ...d, label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) }))}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis width={48} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₦${v}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,88,190,0.06)' }}
                    formatter={(v, key) => [formatMoney(Number(v ?? 0)), key === 'shopper' ? 'Store assistant' : 'Business assistant']}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="shopper" stackId="a" fill="#0058be" maxBarSize={18} />
                  <Bar dataKey="seller" stackId="a" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-[#64748b]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#0058be]" /> Store assistant</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#93c5fd]" /> Business assistant</span>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-card-md">
            <h3 className="text-sm font-semibold text-[#091426]">This month by assistant</h3>
            <div className="mt-3 divide-y divide-[#eef2f7]">
              {(['shopper', 'seller'] as const).map((key) => {
                const row = data.byAssistant.find((a) => a.assistant === key);
                const meta = ASSISTANT_NAME[key];
                const Icon = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff4ff] text-[#0058be]"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#091426]">{meta.label}</p>
                      <p className="text-xs text-[#64748b]">
                        {meta.hint} · {(row?.calls ?? 0).toLocaleString('en-NG')} replies · {(((row?.inputTokens ?? 0) + (row?.outputTokens ?? 0)) / 1000).toFixed(1)}k tokens
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-[#091426]">{formatMoney(row?.cost ?? 0)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-card-md">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#091426]"><Sparkles className="h-4 w-4 text-[#0058be]" /> Credit history</h3>
            {data.credits.length === 0 ? (
              <p className="mt-2 text-sm text-[#64748b]">No credit added yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#eef2f7]">
                {data.credits.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      <span className="text-[#091426]">{c.type === 'ADJUSTMENT' && c.note ? c.note : (CREDIT_LABEL[c.type] ?? c.type)}</span>
                      {c.createdAt && <span className="ml-2 text-xs text-[#94a3b8]">{new Date(c.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>}
                    </span>
                    <span className={cn('font-semibold tabular-nums', c.amount < 0 ? 'text-rose-700' : 'text-emerald-700')}>
                      {c.amount < 0 ? '−' : '+'}
                      {formatMoney(Math.abs(c.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-[#64748b]">
              AI credit is billed separately from your Shelflyd plan and doesn’t expire.
              {data.monthlyFree > 0 && ` You also receive ${formatMoney(data.monthlyFree)} free at the start of every month.`}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint, strong }: { label: string; value: string; hint: string; strong?: boolean }) {
  return (
    <div className={strong ? 'rounded-2xl bg-[#091426] p-4 text-white' : 'rounded-2xl bg-white p-4 shadow-card-md'}>
      <p className={strong ? 'text-xs text-white/70' : 'text-xs text-[#64748b]'}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className={strong ? 'mt-1 text-[11px] text-white/60' : 'mt-1 text-[11px] text-[#94a3b8]'}>{hint}</p>
    </div>
  );
}

/** Paystack sends the owner back here with ?reference=…; confirm the payment once and show the new balance. */
function useSettleReturn() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const done = useRef(false);
  const reference = params.get('reference') ?? params.get('trxref');
  useEffect(() => {
    if (!reference || done.current) return;
    done.current = true;
    sellerAssistantApi
      .verifyTopUp(reference)
      .then((r) => {
        if (r.status === 'PAID') toast.success(`${formatMoney(r.amount)} of AI credit added. Your balance is ${formatMoney(r.balance)}.`);
        else if (r.status === 'FAILED') toast.error('That payment didn’t go through, so no credit was added.');
        else toast.message('Your payment is still being confirmed. The credit appears here as soon as it is.');
      })
      .catch((error) => toast.error(getApiError(error, 'Could not confirm that payment.')))
      .finally(() => {
        qc.invalidateQueries({ queryKey: ['ai-usage'] });
        qc.invalidateQueries({ queryKey: ['assistant-settings'] });
        router.replace('/dashboard/settings/ai');
      });
  }, [reference, qc, router]);
}

/** Buy AI credit with Paystack. Only the owner can pay; team members see who to ask. */
function BuyCredit({ rate }: { rate?: number }) {
  const user = useAuthStore((s) => s.user);
  const { data: business } = useQuery({ queryKey: ['my-business'], queryFn: businessesApi.getProfile });
  const [amount, setAmount] = useState<number>(5000);
  const [custom, setCustom] = useState('');
  const isOwner = !!business && !!user && business.ownerId === user.id;
  const chosen = custom ? Number(custom.replace(/[^\d]/g, '')) : amount;
  const valid = chosen >= 1000 && chosen <= 500000;

  const pay = useMutation({
    mutationFn: () => sellerAssistantApi.topUp(chosen),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (error) => toast.error(getApiError(error, 'Could not start the payment.')),
  });

  return (
    <section className="rounded-2xl bg-white p-5 shadow-card-md">
      <h3 className="text-sm font-semibold text-[#091426]">Buy AI credit</h3>
      <p className="text-xs text-[#64748b]">
        Credit pays for both assistants{rate ? <>, at {formatMoney(rate)} per million tokens (the words the AI reads and writes)</> : null}. A typical reply costs about ₦10 to ₦20, so ₦5,000 covers a few hundred replies.
      </p>
      {!isOwner ? (
        <p className="mt-3 text-sm text-[#64748b]">Only the business owner can buy credit. Ask them to top up from this page.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Amount">
            {PACKS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={!custom && amount === p}
                onClick={() => {
                  setAmount(p);
                  setCustom('');
                }}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-semibold tabular-nums transition-colors',
                  !custom && amount === p ? 'border-[#0058be] bg-[#eff4ff] text-[#0058be]' : 'border-[rgba(9,20,38,0.12)] text-[#091426] hover:bg-[#f8f9ff]',
                )}
              >
                {formatMoney(p)}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs text-[#64748b]">
            Or another amount (₦1,000 to ₦500,000)
            <input
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              placeholder="e.g. 15000"
              className="mt-1 h-10 w-full max-w-xs rounded-lg border border-[rgba(9,20,38,0.15)] px-3 text-sm text-[#091426] outline-none focus-visible:ring-2 focus-visible:ring-[#0058be]/30"
            />
          </label>
          {custom && !valid && <p className="mt-1 text-xs text-amber-700">Choose between ₦1,000 and ₦500,000.</p>}
          <button
            type="button"
            disabled={!valid || pay.isPending}
            onClick={() => pay.mutate()}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#091426] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#091426]/90 disabled:opacity-50"
          >
            {pay.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Pay {valid ? formatMoney(chosen) : ''} with Paystack
          </button>
          <p className="mt-2 text-[11px] text-[#94a3b8]">You’ll pay on Paystack’s secure page and come back here. The credit is added as soon as the payment is confirmed.</p>
        </>
      )}
    </section>
  );
}
