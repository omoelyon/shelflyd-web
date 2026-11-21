'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { inventoryLedgerApi } from '@/lib/api/inventory-ledger';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaginationControls from '@/components/ui/pagination-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StockMovement, StockMovementType } from '@/types/inventory';
import { MovementTypeChip } from './chips';
import { MOVEMENT_TYPE, formatNaira, formatQty, formatSigned, formatWhen } from './format';

const ALL = 'all';
const PAGE_SIZE = 20;

interface HistoryTabProps {
  products: { id: number; name: string }[];
  productId: number | undefined;
  onProductChange: (productId: number | undefined) => void;
}

/** What caused a movement, in words: the seller's note, or a link to the order. */
function Cause({ movement }: { movement: StockMovement }) {
  return (
    <>
      {movement.reason && <span className="text-[#475569]">{movement.reason}</span>}
      {movement.orderId != null && (
        <Link href={`/dashboard/orders/${movement.orderId}`} className="font-medium text-[#0058be] hover:underline">
          {movement.reason ? ' · ' : ''}Order #{movement.orderId}
        </Link>
      )}
      {!movement.reason && movement.orderId == null && <span className="text-[#94a3b8]">—</span>}
    </>
  );
}

const changeColour = (n: number) => (n > 0 ? 'text-emerald-600' : n < 0 ? 'text-red-600' : 'text-[#475569]');

/** Every change to the stock, newest first: the stock card an accountant asks for. */
export default function HistoryTab({ products, productId, onProductChange }: HistoryTabProps) {
  const [type, setType] = useState<StockMovementType | undefined>();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['inventory-movements', { productId, type, from, to, page }],
    queryFn: () => inventoryLedgerApi.movements({ productId, type, from: from || undefined, to: to || undefined, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const productName = productId ? products.find((p) => p.id === productId)?.name ?? 'Product' : 'All products';
  const filtered = productId != null || type != null || from !== '' || to !== '';
  const rangeInvalid = from !== '' && to !== '' && from > to;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-card-md sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Product</Label>
          <Select
            value={productId != null ? String(productId) : ALL}
            onValueChange={(v) => {
              setPage(0);
              onProductChange(v && v !== ALL ? Number(v) : undefined);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{productName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">What happened</Label>
          <Select
            value={type ?? ALL}
            onValueChange={(v) => {
              setPage(0);
              setType(v && v !== ALL ? (v as StockMovementType) : undefined);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{type ? MOVEMENT_TYPE[type].label : 'Everything'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Everything</SelectItem>
              {(Object.keys(MOVEMENT_TYPE) as StockMovementType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {MOVEMENT_TYPE[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="history-from" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">From</Label>
          <Input id="history-from" type="date" value={from} max={to || undefined} onChange={(e) => { setPage(0); setFrom(e.target.value); }} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="history-to" className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">To</Label>
          <Input id="history-to" type="date" value={to} min={from || undefined} onChange={(e) => { setPage(0); setTo(e.target.value); }} />
        </div>
        {rangeInvalid && <p className="text-xs text-destructive sm:col-span-2 lg:col-span-4">The start date is after the end date.</p>}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-card-md">
          <p className="text-sm text-[#64748b]">We couldn’t load the stock history.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-[#0058be] hover:underline">
            Try again
          </button>
        </div>
      ) : data.content.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-card-md">
          <EmptyState
            icon={History}
            title={filtered ? 'No changes match these filters' : 'No stock changes yet'}
            subtitle={filtered ? 'Try a wider date range or another product.' : 'Every sale, restock and correction will be listed here, so your stock always adds up.'}
          />
        </div>
      ) : (
        <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-70')}>
          <p className="text-xs text-[#64748b]">
            {data.totalElements.toLocaleString()} {data.totalElements === 1 ? 'change' : 'changes'}
            {productId != null && <> for <span className="font-medium text-[#091426]">{productName}</span></>}
          </p>

          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card-md md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">When</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>What happened</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Stock after</TableHead>
                  <TableHead className="text-right">Cost each</TableHead>
                  <TableHead className="pr-4">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4 text-xs text-[#475569] whitespace-nowrap">{formatWhen(m.createdAt)}</TableCell>
                    <TableCell className="max-w-48 truncate text-sm font-medium text-[#091426]">{m.productName}</TableCell>
                    <TableCell><MovementTypeChip type={m.type} /></TableCell>
                    <TableCell className={cn('text-right text-sm font-semibold tabular-nums', changeColour(m.quantity))}>{formatSigned(m.quantity)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-[#091426]">{formatQty(m.balanceAfter)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-[#475569]">{formatNaira(m.unitCost)}</TableCell>
                    <TableCell className="max-w-64 truncate pr-4 text-xs"><Cause movement={m} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-2 md:hidden">
            {data.content.map((m) => (
              <li key={m.id} className="rounded-2xl bg-white p-4 shadow-card-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#091426]">{m.productName}</p>
                    <p className="mt-0.5 text-xs text-[#64748b]">{formatWhen(m.createdAt)}</p>
                  </div>
                  <p className={cn('shrink-0 text-lg font-bold tabular-nums font-heading', changeColour(m.quantity))}>{formatSigned(m.quantity)}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <MovementTypeChip type={m.type} />
                  <span className="text-[#64748b]">Stock after: <span className="font-medium tabular-nums text-[#091426]">{formatQty(m.balanceAfter)}</span></span>
                  {m.unitCost != null && <span className="text-[#64748b]">Cost each: <span className="font-medium tabular-nums text-[#091426]">{formatNaira(m.unitCost)}</span></span>}
                </div>
                {(m.reason || m.orderId != null) && (
                  <p className="mt-2 text-xs"><Cause movement={m} /></p>
                )}
              </li>
            ))}
          </ul>

          <PaginationControls
            page={data.number}
            totalPages={data.totalPages}
            isFirst={data.first}
            isLast={data.last}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}
