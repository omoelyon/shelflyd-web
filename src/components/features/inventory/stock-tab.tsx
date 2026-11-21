'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, History, PackagePlus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CoverItem, StockCover } from '@/types/inventory';
import { CoverStatusChip, Tag } from './chips';
import { formatDay, formatNaira, formatQty } from './format';
import ProductThumb from './product-thumb';

type Filter = 'all' | 'attention' | 'out' | 'slow' | 'nocost';

const FILTERS: { key: Filter; label: string; test: (i: CoverItem) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'attention', label: 'Needs attention', test: (i) => i.status === 'OUT' || i.status === 'CRITICAL' || i.status === 'LOW' },
  { key: 'out', label: 'Out of stock', test: (i) => i.status === 'OUT' },
  { key: 'slow', label: 'Slow movers', test: (i) => i.slowMover },
  { key: 'nocost', label: 'No cost price', test: (i) => i.costPrice == null && i.onHand > 0 },
];

/** "About 4 days" / "Under a day" for the stock cover figure. */
function daysLeft(item: CoverItem): string | null {
  if (item.daysOfCover == null) return null;
  if (item.daysOfCover < 1) return 'Under a day';
  const days = Math.round(item.daysOfCover);
  return `About ${days} ${days === 1 ? 'day' : 'days'}`;
}

interface StockTabProps {
  cover: StockCover;
  onAdjust: (item: CoverItem) => void;
  onHistory: (productId: number) => void;
}

/** Every product with what is left, how fast it sells and how long it will last; filter to what needs attention. */
export default function StockTab({ cover, onAdjust, onHistory }: StockTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, cover.items.filter(f.test).length])) as Record<Filter, number>, [cover.items]);

  const rows = useMemo(() => {
    const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true);
    const q = search.trim().toLowerCase();
    return cover.items.filter((i) => test(i) && (!q || i.name.toLowerCase().includes(q)));
  }, [cover.items, filter, search]);

  if (cover.items.length === 0) {
    return (
      <div className="rounded-2xl bg-white shadow-card-md">
        <EmptyState
          icon={Boxes}
          title="No products to track yet"
          subtitle="Add a product with its stock, and you'll see here how long it will last."
          action={{ label: 'Add a product', onClick: () => router.push('/dashboard/products/new') }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                filter === f.key ? 'border-[#091426] bg-[#091426] text-white' : 'border-[rgba(9,20,38,0.15)] bg-white text-[#475569] hover:bg-[#f8f9ff]',
              )}
            >
              {f.label} <span className={cn('tabular-nums', filter === f.key ? 'text-white/70' : 'text-[#94a3b8]')}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" aria-hidden="true" />
          <Input className="pl-8" placeholder="Search products" aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#64748b] shadow-card-md">Nothing matches. Try another filter or search.</div>
      ) : (
        <>
          {/* Wide screens: a table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card-md md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead className="text-right">Sells per day</TableHead>
                  <TableHead>Lasts</TableHead>
                  <TableHead className="text-right">Stock value</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={item.image} name={item.name} />
                        <div className="min-w-0">
                          <p className="max-w-56 truncate text-sm font-medium text-[#091426]">{item.name}</p>
                          <p className="text-xs text-[#64748b]">Counted in {item.baseUnit}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <CoverStatusChip status={item.status} />
                        {item.slowMover && <Tag>Slow mover</Tag>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      <span className="font-semibold text-[#091426]">{formatQty(item.onHand)}</span> <span className="text-[#64748b]">{item.baseUnit}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-[#475569]">{item.avgDailySales > 0 ? formatQty(item.avgDailySales) : '—'}</TableCell>
                    <TableCell className="text-sm text-[#475569]">
                      {daysLeft(item) ? (
                        <>
                          <span className="font-medium text-[#091426]">{daysLeft(item)}</span>
                          {item.runOutDate && <span className="block text-xs text-[#64748b]">Runs out about {formatDay(item.runOutDate)}</span>}
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.stockValue != null ? (
                        formatNaira(item.stockValue)
                      ) : item.onHand > 0 ? (
                        <Link href="/dashboard/products" className="text-xs font-medium text-[#0058be] hover:underline">
                          Add cost price
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => onAdjust(item)}>
                          <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
                          Change stock
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => onHistory(item.productId)} aria-label={`History of ${item.name}`}>
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Phones: one card per product */}
          <ul className="space-y-3 md:hidden">
            {rows.map((item) => (
              <li key={item.productId} className="rounded-2xl bg-white p-4 shadow-card-md">
                <div className="flex items-start gap-3">
                  <ProductThumb src={item.image} name={item.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#091426]">{item.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <CoverStatusChip status={item.status} />
                      {item.slowMover && <Tag>Slow mover</Tag>}
                    </div>
                  </div>
                  <p className="shrink-0 text-right text-sm tabular-nums">
                    <span className="block text-lg font-bold text-[#091426] font-heading">{formatQty(item.onHand)}</span>
                    <span className="text-xs text-[#64748b]">{item.baseUnit}</span>
                  </p>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-[#64748b]">Sells per day</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-[#091426]">{item.avgDailySales > 0 ? formatQty(item.avgDailySales) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Lasts</dt>
                    <dd className="mt-0.5 font-medium text-[#091426]">{daysLeft(item) ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748b]">Value</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-[#091426]">{item.stockValue != null ? formatNaira(item.stockValue) : '—'}</dd>
                  </div>
                </dl>
                {item.runOutDate && <p className="mt-2 text-xs text-[#64748b]">Runs out about {formatDay(item.runOutDate)}</p>}
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => onAdjust(item)}>
                    <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
                    Change stock
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => onHistory(item.productId)}>
                    <History className="mr-1.5 h-4 w-4" />
                    History
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
