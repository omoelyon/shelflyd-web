'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { InsightOverview } from '@/types/insights';
import { comparisonLabel, naira } from './insights-format';

interface Row {
  label: string;
  current: number | null;
  previous: number | null;
}

function SeriesTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-[0_4px_20px_rgba(9,20,38,0.12)]">
      <p className="font-semibold text-[#091426]">{row.label}</p>
      <p className="text-[#0058be]">This period: {naira(row.current ?? 0)}</p>
      <p className="text-[#64748b]">Before: {naira(row.previous ?? 0)}</p>
    </div>
  );
}

/** Two bars side by side: used for a single day, where a line has nothing to draw. */
function DayBars({ overview }: { overview: InsightOverview }) {
  const point = overview.series?.[0];
  const rows = [
    { name: overview.previous.label || 'Before', value: point?.previous ?? overview.metrics.revenue?.previous ?? 0, fill: '#cbd5e1' },
    { name: overview.current.label || 'Now', value: point?.current ?? overview.metrics.revenue?.current ?? 0, fill: '#0058be' },
  ];
  return (
    <ResponsiveContainer width="100%" height={208}>
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,20,38,0.05)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => naira(v as number)} />
        <Tooltip cursor={{ fill: 'rgba(0,88,190,0.06)' }} formatter={(v) => [naira(Number(v ?? 0)), 'Revenue']} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={96}>
          {rows.map((r) => (
            <Cell key={r.name} fill={r.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Revenue per day for this period (filled blue) over the comparison period (dashed grey), lined up day by day. */
export default function InsightsChart({ overview }: { overview: InsightOverview }) {
  const rows: Row[] = (overview.series ?? []).map((p) => ({ label: p.label, current: p.current ?? 0, previous: p.previous ?? 0 }));
  const against = comparisonLabel(overview);
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card-md" aria-labelledby="insights-chart-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 id="insights-chart-title" className="font-heading text-sm font-bold text-[#091426]">
          Revenue, {overview.current.label}
        </h3>
        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-[#0058be]" aria-hidden="true" />
            This period
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-[#94a3b8]" aria-hidden="true" />
            {against}
          </span>
        </div>
      </div>
      <div role="img" aria-label={`Revenue ${overview.current.label} compared with ${against}`}>
        {rows.length <= 1 ? (
          <DayBars overview={overview} />
        ) : (
          <ResponsiveContainer width="100%" height={208}>
            <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="insightsCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0058be" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,20,38,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => naira(v as number)} />
              <Tooltip content={<SeriesTooltip />} />
              <Line type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="current" stroke="#0058be" strokeWidth={2} fill="url(#insightsCurrent)" dot={false} activeDot={{ r: 4, fill: '#0058be', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
