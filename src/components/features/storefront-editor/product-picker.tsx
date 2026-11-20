'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { businessesApi } from '@/lib/api/businesses';

interface Props {
  value: number[];
  onChange: (ids: number[]) => void;
  max: number;
}

/**
 * Picks products for a featured section from the seller's own catalogue: chosen ones are listed in order (with
 * move and remove), and a searchable list below adds more until the limit.
 */
export default function ProductPicker({ value, onChange, max }: Props) {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['storefront-editor', 'my-products'],
    queryFn: () => businessesApi.getProducts(0, 100),
  });
  const products = useMemo(() => data?.content ?? [], [data]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const q = search.trim().toLowerCase();
  const available = products.filter((p) => !value.includes(p.id) && (!q || p.name.toLowerCase().includes(q)));
  const full = value.length >= max;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Products to feature</p>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {value.length}/{max}
        </span>
      </div>

      {value.length > 0 ? (
        <ol className="space-y-1.5">
          {value.map((id, index) => {
            const name = byId.get(id)?.name ?? (isLoading ? 'Loading…' : 'Product no longer available');
            return (
              <li key={id} className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 flex items-center gap-1 rounded-lg border bg-background py-1 pl-2.5 pr-1 duration-300 ease-(--ease-out)">
                <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${name} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${name} down`} disabled={index === value.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remove ${name}`} onClick={() => onChange(value.filter((v) => v !== id))}>
                  <X />
                </Button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">No products picked yet. This section stays hidden from shoppers until you pick some.</p>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products" aria-label="Search your products" className="pl-8" />
        </div>
        {isError ? (
          <p role="alert" className="text-xs text-destructive">
            Could not load your products. Try again in a moment.
          </p>
        ) : isLoading ? (
          <p className="text-xs text-muted-foreground">Loading your products…</p>
        ) : available.length === 0 ? (
          <p className="text-xs text-muted-foreground">{products.length === 0 ? 'You have no products yet.' : q ? 'No product matches your search.' : 'Every product is already picked.'}</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
            {available.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => onChange([...value, p.id])}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {full && <p className="text-xs text-muted-foreground">You can feature up to {max} products.</p>}
      </div>
    </div>
  );
}
