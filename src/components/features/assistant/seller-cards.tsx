'use client';

import Link from 'next/link';
import { ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import type { MetricItem } from '@/types/assistant';
import type { AnyCard } from '@/components/features/ai-chat/use-ai-chat';
import { QuickReplies, type CardContext } from '@/components/features/ai-chat/chat-view';

const shell = 'rounded-2xl border border-[rgba(9,20,38,0.08)] bg-white shadow-sm';

function format(value: number | null | undefined, kind: string): string {
  if (value == null) return '—';
  if (kind === 'money') return formatMoney(value);
  if (kind === 'percent') return `${Number(value).toFixed(1).replace(/\.0$/, '')}%`;
  return Number(value).toLocaleString('en-NG', { maximumFractionDigits: 1 });
}

function Heading({ title, subtitle }: { title?: unknown; subtitle?: unknown }) {
  if (!title && !subtitle) return null;
  return (
    <div className="px-3.5 pt-3">
      {title ? <p className="text-[13px] font-semibold text-[#091426]">{String(title)}</p> : null}
      {subtitle ? <p className="text-[11px] text-[#64748b]">{String(subtitle)}</p> : null}
    </div>
  );
}

/** Headline figures with the change against the previous period. */
function MetricsCard({ card }: { card: AnyCard }) {
  const items = (card.items as MetricItem[]) ?? [];
  return (
    <div className={shell}>
      <Heading title={card.title} subtitle={card.subtitle} />
      <dl className="grid grid-cols-2 gap-px overflow-hidden p-3.5 pt-2.5">
        {items.map((m) => {
          const up = (m.changePct ?? 0) > 0;
          const flat = m.changePct == null || m.changePct === 0;
          return (
            <div key={m.label} className="py-1.5">
              <dt className="text-[11px] text-[#64748b]">{m.label}</dt>
              <dd className="text-base font-bold tabular-nums text-[#091426]">{format(m.value, m.format)}</dd>
              {!flat && (
                <dd className={cn('flex items-center gap-0.5 text-[11px] font-medium tabular-nums', up ? 'text-emerald-700' : 'text-rose-700')}>
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(Number(m.changePct)).toFixed(0)}%
                  <span className="font-normal text-[#94a3b8]">&nbsp;was {format(m.previous, m.format)}</span>
                </dd>
              )}
              {flat && m.previous != null && <dd className="text-[11px] text-[#94a3b8]">was {format(m.previous, m.format)}</dd>}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** A small bar chart: this period against the one before. */
function ChartCard({ card }: { card: AnyCard }) {
  const labels = (card.labels as string[]) ?? [];
  const series = (card.series as { name: string; values: number[] }[]) ?? [];
  const kind = String(card.format ?? 'count');
  const data = labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    series.forEach((s, j) => (row[`s${j}`] = Number(s.values[i] ?? 0)));
    return row;
  });
  const empty = data.every((row) => series.every((_, j) => !row[`s${j}`]));
  const colors = ['#0058be', '#cbd5e1'];
  return (
    <div className={shell}>
      <Heading title={card.title} subtitle={card.subtitle} />
      {empty ? (
        <p className="px-3.5 pb-3.5 pt-2 text-xs text-[#64748b]">No sales in this period yet.</p>
      ) : (
        <div className="h-40 px-1.5 pb-2 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={1}>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                width={44}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => (kind === 'money' ? (v >= 1000 ? `₦${Math.round(v / 1000)}k` : `₦${v}`) : String(v))}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,88,190,0.06)' }}
                formatter={(v, key) => [format(Number(v ?? 0), kind), series[Number(String(key).slice(1))]?.name ?? '']}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
              />
              {series.map((s, j) => (
                <Bar key={s.name} dataKey={`s${j}`} fill={colors[j % colors.length]} radius={[3, 3, 0, 0]} maxBarSize={18} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {series.length > 1 && !empty && (
        <div className="flex gap-3 px-3.5 pb-3 text-[11px] text-[#64748b]">
          {series.map((s, j) => (
            <span key={s.name} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ background: colors[j % colors.length] }} aria-hidden="true" />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  OUT: 'bg-rose-50 text-rose-700',
  CRITICAL: 'bg-rose-50 text-rose-700',
  LOW: 'bg-amber-50 text-amber-800',
  OK: 'bg-emerald-50 text-emerald-700',
  HEALTHY: 'bg-emerald-50 text-emerald-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  DISPATCHED: 'bg-indigo-50 text-indigo-700',
};

function statusLabel(s: string): string {
  const t = s.toLowerCase().replace(/_/g, ' ');
  return t === 'out' ? 'Out of stock' : t.charAt(0).toUpperCase() + t.slice(1);
}

/** A compact table; rows with an href open that page. */
function TableCard({ card, onNavigate }: { card: AnyCard; onNavigate: () => void }) {
  const columns = (card.columns as { key: string; label: string; align: 'left' | 'right'; format: string }[]) ?? [];
  const rows = (card.rows as Record<string, unknown>[]) ?? [];
  const link = card.link as { href: string; label: string } | undefined;
  return (
    <div className={cn(shell, 'overflow-hidden')}>
      <Heading title={card.title} subtitle={card.subtitle} />
      {rows.length === 0 ? (
        <p className="px-3.5 pb-3.5 pt-2 text-xs text-[#64748b]">Nothing to show.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-y border-[#eef2f7] bg-[#f8f9ff] text-[10px] uppercase tracking-wide text-[#64748b]">
                {columns.map((c) => (
                  <th key={c.key} className={cn('px-3 py-1.5 font-semibold', c.align === 'right' ? 'text-right' : 'text-left')}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f7]">
              {rows.map((row, i) => (
                <tr key={i} className={cn(row.href ? 'cursor-pointer hover:bg-[#f8f9ff]' : '')}>
                  {columns.map((c, j) => {
                    const v = row[c.key];
                    const content =
                      c.format === 'money' ? format(Number(v), 'money')
                      : c.format === 'status' && typeof v === 'string' ? (
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', STATUS_STYLE[v.toUpperCase()] ?? 'bg-slate-100 text-slate-700')}>{statusLabel(v)}</span>
                      )
                      : String(v ?? '—');
                    const cell = j === 0 && typeof row.href === 'string' ? (
                      <Link href={row.href} onClick={onNavigate} className="font-medium text-[#0058be] hover:underline">
                        {content}
                      </Link>
                    ) : (
                      content
                    );
                    return (
                      <td key={c.key} className={cn('px-3 py-1.5 tabular-nums', c.align === 'right' ? 'text-right' : 'text-left', j === 0 && 'font-medium text-[#091426]')}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {typeof card.note === 'string' && <p className="px-3.5 pt-2 text-[11px] text-amber-700">{card.note}</p>}
      {link && (
        <div className="px-3.5 py-2.5">
          <Link href={link.href} onClick={onNavigate} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0058be] hover:underline">
            {link.label} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      {!link && <div className="h-2" />}
    </div>
  );
}

/** A button to the dashboard page where the seller can do what the assistant described. */
function LinkCard({ card, onNavigate }: { card: AnyCard; onNavigate: () => void }) {
  return (
    <Link
      href={String(card.href)}
      onClick={onNavigate}
      className="flex items-center justify-between gap-3 rounded-xl bg-[#091426] px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#091426]/90"
    >
      <span>
        {String(card.label)}
        {card.page ? <span className="block text-[11px] font-normal text-white/60">{String(card.page)}</span> : null}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

export function SellerCard({ card, ctx, onNavigate }: { card: AnyCard; ctx: CardContext; onNavigate: () => void }) {
  switch (card.type) {
    case 'group':
      return (
        <div className="space-y-2.5">
          {((card.cards as AnyCard[]) ?? []).map((c, i) => (
            <SellerCard key={`${c.type}-${i}`} card={c} ctx={ctx} onNavigate={onNavigate} />
          ))}
        </div>
      );
    case 'metrics':
      return <MetricsCard card={card} />;
    case 'chart':
      return <ChartCard card={card} />;
    case 'table':
      return <TableCard card={card} onNavigate={onNavigate} />;
    case 'link':
      return <LinkCard card={card} onNavigate={onNavigate} />;
    case 'replies':
      return ctx.latest ? <QuickReplies options={card.options as string[]} onPick={ctx.send} disabled={ctx.busy} /> : null;
    default:
      return null;
  }
}
