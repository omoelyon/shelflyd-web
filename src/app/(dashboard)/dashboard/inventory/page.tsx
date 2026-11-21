'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { inventoryLedgerApi } from '@/lib/api/inventory-ledger';
import { buttonVariants } from '@/components/ui/button';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import AdjustStockDialog, { type AdjustTarget } from '@/components/features/inventory/adjust-stock-dialog';
import HistoryTab from '@/components/features/inventory/history-tab';
import StockTab from '@/components/features/inventory/stock-tab';
import SummaryCards from '@/components/features/inventory/summary-cards';
import type { CoverItem } from '@/types/inventory';

type Tab = 'stock' | 'history';

function InventoryView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The tab and product filter live in the address, so "History" for one product can be linked to and survives a refresh.
  const tab: Tab = searchParams.get('tab') === 'history' ? 'history' : 'stock';
  const productParam = Number(searchParams.get('product'));
  const productId = Number.isInteger(productParam) && productParam > 0 ? productParam : undefined;

  const go = (next: { tab?: Tab; product?: number | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.tab) {
      if (next.tab === 'history') params.set('tab', 'history');
      else params.delete('tab');
    }
    if (next.product !== undefined) {
      if (next.product) params.set('product', String(next.product));
      else params.delete('product');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const { data: cover, isLoading, isError, refetch } = useQuery({
    queryKey: ['inventory-cover'],
    queryFn: inventoryLedgerApi.cover,
    staleTime: 30_000,
  });

  const [adjusting, setAdjusting] = useState<AdjustTarget | null>(null);
  const openAdjust = (item: CoverItem) =>
    setAdjusting({ productId: item.productId, name: item.name, baseUnit: item.baseUnit, onHand: item.onHand, costPrice: item.costPrice });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="What is in stock, how long it will last, and every change to it."
        action={
          <Link href="/dashboard/products/new" className={cn(buttonVariants(), 'bg-[#091426] text-white hover:bg-[#091426]/90')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add product
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : isError || !cover ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-card-md">
          <p className="text-sm text-[#64748b]">We couldn’t load your inventory.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-semibold text-[#0058be] hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          <SummaryCards summary={cover.summary} />

          <Tabs value={tab} onValueChange={(v) => go({ tab: v === 'history' ? 'history' : 'stock' })}>
            <TabsList>
              <TabsTrigger value="stock">Stock</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="stock" className="pt-3">
              <StockTab cover={cover} onAdjust={openAdjust} onHistory={(id) => go({ tab: 'history', product: id })} />
            </TabsContent>
            <TabsContent value="history" className="pt-3">
              <HistoryTab
                products={cover.items.map((i) => ({ id: i.productId, name: i.name }))}
                productId={productId}
                onProductChange={(id) => go({ product: id ?? null })}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {adjusting && <AdjustStockDialog key={adjusting.productId} target={adjusting} onClose={() => setAdjusting(null)} />}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <InventoryView />
    </Suspense>
  );
}
