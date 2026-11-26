'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, PlugZap, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminAiApi } from '@/lib/api/assistant';
import { formatMoney } from '@/lib/money';
import { getApiError } from '@/lib/utils';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const card = 'rounded-2xl bg-white shadow-[0_2px_12px_rgba(9,20,38,0.06)]';
const usd = (v: number) => '$' + v.toFixed(v < 1 ? 4 : 2);

/** Shelflyd staff: what the AI assistants cost across all businesses, who uses them, and adjusting a business's credit. */
export default function AdminAiPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({ queryKey: ['admin-ai', days], queryFn: () => adminAiApi.usage(days) });

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="AI assistants"
        subtitle={data ? (data.available ? 'On' : 'Off') + ' · ' + data.provider + ' · ' + data.model : 'Usage and AI credit across businesses'}
      />

      <ConnectionCheck />

      <div className="flex gap-1.5" role="radiogroup" aria-label="Period">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={days === d}
            onClick={() => setDays(d)}
            className={
              days === d
                ? 'rounded-lg bg-[#091426] px-3 py-1.5 text-xs font-semibold text-white'
                : 'rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#64748b] shadow-sm hover:text-[#091426]'
            }
          >
            Last {d} days
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Charged to businesses" value={formatMoney(data.charged)} hint={data.calls.toLocaleString('en-NG') + ' model calls'} />
            <Stat label="Provider cost" value={usd(data.providerCostUsd)} hint={'≈ ' + formatMoney(data.providerCostNaira)} />
            <Stat label="Margin" value={formatMoney(data.charged - data.providerCostNaira)} hint="Charged minus provider cost" />
            <Stat
              label="Credit bought"
              value={formatMoney(data.topUpsPaid)}
              hint={data.activeBusinesses + (data.activeBusinesses === 1 ? ' business' : ' businesses') + ' used AI'}
            />
          </div>

          <section className={card + ' p-5'}>
            <h3 className="text-sm font-semibold text-[#091426]">Charged per day</h3>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.daily.map((d) => ({
                    ...d,
                    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
                  }))}
                >
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis width={52} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => '₦' + v} />
                  <Tooltip
                    formatter={(v, key) => [formatMoney(Number(v ?? 0)), key === 'shopper' ? 'Store assistants' : 'Business assistants']}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="shopper" stackId="a" fill="#0058be" maxBarSize={18} />
                  <Bar dataKey="seller" stackId="a" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={card + ' overflow-hidden'}>
            <h3 className="px-5 pt-5 text-sm font-semibold text-[#091426]">Models</h3>
            <Table
              head={['Model', 'Calls', 'Tokens in / out', 'Provider cost', 'Charged']}
              rows={data.models.map((m) => [
                m.model + ' (' + m.provider + ')',
                m.calls.toLocaleString('en-NG'),
                (m.inputTokens / 1000).toFixed(1) + 'k / ' + (m.outputTokens / 1000).toFixed(1) + 'k',
                usd(m.providerCostUsd),
                formatMoney(m.charged),
              ])}
              empty="No AI calls in this period."
            />
          </section>

          <section className={card + ' overflow-hidden'}>
            <h3 className="px-5 pt-5 text-sm font-semibold text-[#091426]">Top businesses</h3>
            <Table
              head={['Business', 'Calls', 'Charged', 'Credit left']}
              rows={data.topBusinesses.map((b) => [
                b.name + (b.slug ? ' (' + b.slug + ')' : '') + ' · #' + b.businessId,
                b.calls.toLocaleString('en-NG'),
                formatMoney(b.charged),
                formatMoney(b.balance),
              ])}
              empty="No business has used the assistants in this period."
            />
          </section>
        </>
      )}

      <AdjustCredit />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={card + ' p-4'}>
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[#091426]">{value}</p>
      <p className="mt-1 text-[11px] text-[#94a3b8]">{hint}</p>
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="px-5 pb-5 pt-2 text-sm text-[#64748b]">{empty}</p>;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-[#f1f5f9] text-[10px] uppercase tracking-[0.1em] text-[#64748b]">
            {head.map((h, i) => (
              <th key={h} className={'px-5 py-2 font-bold ' + (i === 0 ? 'text-left' : 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={'px-5 py-2.5 tabular-nums ' + (j === 0 ? 'text-left font-medium text-[#091426]' : 'text-right text-[#334155]')}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sends one tiny request to the AI provider and shows the result, including the provider's own error (e.g. a key problem). */
function ConnectionCheck() {
  const check = useMutation({ mutationFn: adminAiApi.check });
  const r = check.data;
  return (
    <section className={card + ' p-5'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#091426]">Connection to the AI provider</h3>
          <p className="text-xs text-[#64748b]">Sends one tiny request with the assistants’ settings. Costs a fraction of a naira; no business is charged.</p>
        </div>
        <button
          type="button"
          onClick={() => check.mutate()}
          disabled={check.isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#091426] px-3.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {check.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
          Test connection
        </button>
      </div>
      {check.isError && <p className="mt-3 text-sm text-rose-700">{getApiError(check.error, 'Could not run the test.')}</p>}
      {r && (
        <div className={'mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ' + (r.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900')} role="status">
          {r.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="min-w-0">
            <p className="font-semibold">
              {r.ok ? 'Working' : 'Not working'} · {r.provider} · {r.model} · {(r.millis / 1000).toFixed(1)}s
            </p>
            {r.ok ? <p className="text-xs">The model replied “{r.reply}”.</p> : <p className="mt-0.5 break-words font-mono text-xs">{r.error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

/** Grant credit (goodwill, a trial) or correct it with a negative amount. Every change is recorded with a note. */
function AdjustCredit() {
  const qc = useQueryClient();
  const [businessId, setBusinessId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const save = useMutation({
    mutationFn: () => adminAiApi.adjust(Number(businessId), Number(amount), note),
    onSuccess: (r) => {
      toast.success('Done. Business #' + r.businessId + ' now has ' + formatMoney(r.balance) + ' of AI credit.');
      setAmount('');
      setNote('');
      qc.invalidateQueries({ queryKey: ['admin-ai'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Could not adjust the credit.')),
  });
  const valid = /^\d+$/.test(businessId) && /^-?\d+(\.\d{1,2})?$/.test(amount) && Number(amount) !== 0 && note.trim().length >= 3;
  const field = 'h-10 rounded-lg border border-[rgba(9,20,38,0.15)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0058be]/30';

  return (
    <section className={card + ' p-5'}>
      <h3 className="text-sm font-semibold text-[#091426]">Adjust a business’s AI credit</h3>
      <p className="text-xs text-[#64748b]">
        Add credit (e.g. a trial or goodwill) or remove it with a negative amount. The business sees it in their credit history.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[120px_140px_1fr_auto]">
        <input className={field} inputMode="numeric" placeholder="Business ID" value={businessId} onChange={(e) => setBusinessId(e.target.value.trim())} aria-label="Business ID" />
        <input className={field} inputMode="decimal" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value.trim())} aria-label="Amount in naira" />
        <input className={field} placeholder="Reason (shown to the business)" value={note} maxLength={180} onChange={(e) => setNote(e.target.value)} aria-label="Reason" />
        <button
          type="button"
          disabled={!valid || save.isPending}
          onClick={() => save.mutate()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#091426] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Apply
        </button>
      </div>
    </section>
  );
}
