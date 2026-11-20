'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Layers, Minus, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { productsApi } from '@/lib/api/products';
import { useCartSetsActions, useSetsVariant, type SetItemInput } from '@/lib/cart-sets';
import { cn, getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuantityField from '@/components/ui/quantity-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { CartGroup, CartProduct, PriceDetail, Product } from '@/types';

export interface SetBuilderDialogProps {
  businessId: number;
  businessName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Open on an existing set to change it instead of building a new one. */
  editing?: { group: CartGroup; lines: CartProduct[] } | null;
  /** Start with this item already in the set (used by "Add to a set" on a product page). */
  initialItem?: { productId: number; unitId: number };
}

interface Entry {
  productId: number;
  unitId: number;
  /** Units in ONE set. */
  per: number;
}

const MAX_SETS = 1000;
const SEARCH_THRESHOLD = 8;
const money = (n: number) => `₦${Math.round(n).toLocaleString()}`;

const purchasable = (p: Product) =>
  p.status !== 'OUT_OF_STOCK' && p.status !== 'COMING_SOON' && (p.prices?.length ?? 0) > 0;

const defaultUnit = (p: Product): number => (p.prices.find((x) => x.isBaseUnit) ?? p.prices[0]).unit;

/** Design 2: build ONE set from the store's menu, then choose how many of it to order. */
export function SetBuilderDialog(props: SetBuilderDialogProps) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // phones: a bottom sheet; desktop: a centred 480px dialog
          'top-auto bottom-0 left-0 h-[92dvh] max-h-[92dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl',
          'sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:h-auto sm:max-h-[85dvh] sm:max-w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
          'flex flex-col gap-0 overflow-hidden p-0',
        )}
      >
        {open && <Builder {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function Stepper({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  label: string;
}) {
  return <QuantityField size="sm" value={value} onChange={onChange} label={label} min={min} />;
}

function Builder({ businessId, businessName, onOpenChange, editing, initialItem }: SetBuilderDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { createSet, updateSet } = useCartSetsActions(businessId);

  const [entries, setEntries] = useState<Entry[]>(() => {
    if (editing) {
      return editing.lines.map((l) => ({ productId: l.productId, unitId: l.unitId, per: l.quantityPerSet ?? 1 }));
    }
    return initialItem ? [{ productId: initialItem.productId, unitId: initialItem.unitId, per: 1 }] : [];
  });
  const [unitPick, setUnitPick] = useState<Record<number, number>>({});
  const [setsText, setSetsText] = useState(() => String(editing?.group.sets ?? 1));
  const [name, setName] = useState(editing?.group.name ?? '');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['set-builder', 'products', businessId],
    queryFn: () => productsApi.listByBusiness(businessId, 0, 100),
    staleTime: 60 * 1000,
  });
  const products = useMemo(() => (data?.content ?? []).filter(purchasable), [data]);

  // Items of the set being edited that are no longer listed (sold out since) still need their details.
  const lineInfo = useMemo(() => new Map((editing?.lines ?? []).map((l) => [`${l.productId}:${l.unitId}`, l])), [editing]);

  const detailsFor = (e: Entry): SetItemInput | null => {
    const product = (data?.content ?? []).find((p) => p.id === e.productId);
    const price: PriceDetail | undefined = product?.prices?.find((p) => p.unit === e.unitId);
    if (product && price) {
      return {
        productId: e.productId,
        unitId: e.unitId,
        quantityPerSet: e.per,
        name: product.name,
        type: product.type,
        image: product.image,
        unit: price.unitName,
        unitPrice: price.price,
      };
    }
    const line = lineInfo.get(`${e.productId}:${e.unitId}`);
    if (line) {
      return {
        productId: e.productId,
        unitId: e.unitId,
        quantityPerSet: e.per,
        name: line.name,
        type: line.type,
        image: line.image,
        unit: line.unit,
        unitPrice: line.unitPrice,
      };
    }
    return null;
  };

  const resolved = entries.map(detailsFor).filter((d): d is SetItemInput => d !== null);
  const stillLoading = resolved.length !== entries.length;
  const perSetPrice = resolved.reduce((s, i) => s + i.unitPrice * i.quantityPerSet, 0);
  const sets = Math.min(MAX_SETS, parseInt(setsText, 10) || 0);
  const entryFor = (productId: number) => entries.find((e) => e.productId === productId);

  const setPer = (productId: number, per: number) => {
    setError('');
    setEntries((prev) =>
      per < 1 ? prev.filter((e) => e.productId !== productId) : prev.map((e) => (e.productId === productId ? { ...e, per } : e)),
    );
  };
  const addProduct = (p: Product) => {
    setError('');
    const unitId = unitPick[p.id] ?? defaultUnit(p);
    setEntries((prev) => [...prev, { productId: p.id, unitId, per: 1 }]);
  };
  const pickUnit = (p: Product, unitId: number) => {
    setUnitPick((prev) => ({ ...prev, [p.id]: unitId }));
    setEntries((prev) => prev.map((e) => (e.productId === p.id ? { ...e, unitId } : e)));
  };
  const changeSets = (n: number) => setSetsText(String(Math.max(1, Math.min(MAX_SETS, n))));

  const storeSlug = /^\/storefront\/([^/]+)/.exec(pathname ?? '')?.[1];
  const cartHref = storeSlug ? `/storefront/${storeSlug}/cart` : '/cart';

  const submit = async () => {
    if (resolved.length < 2) {
      setError('A set needs at least 2 items. For one item, just tap Add.');
      return;
    }
    if (sets < 1) {
      setError(`Enter how many sets, from 1 to ${MAX_SETS}.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const input = { name: name.trim() || undefined, sets, items: resolved };
      if (editing) await updateSet(editing.group.groupId, input);
      else await createSet(input);
      const label = name.trim() || (editing ? editing.group.name : 'Set');
      toast.success(
        editing
          ? `${label} updated`
          : `${label} added: ${sets} × (${resolved.map((i) => i.name).join(' + ')})`,
        { action: { label: 'View cart', onClick: () => router.push(cartHref) } },
      );
      onOpenChange(false);
    } catch (e) {
      setError(getApiError(e, 'Could not add this set. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const shown = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;
  const unlisted = entries.filter((e) => !products.some((p) => p.id === e.productId));

  return (
    <>
      <DialogHeader className="shrink-0 gap-1 border-b p-4 pr-12">
        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
          <Layers className="h-4 w-4 text-[#0058be]" aria-hidden="true" />
          {editing ? 'Edit set' : 'Build a set'}
        </DialogTitle>
        <DialogDescription>{businessName ? `From ${businessName}` : 'Order the same combo several times.'}</DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <div className="rounded-lg bg-[#eff4ff] px-3 py-2.5 text-xs text-[#0058be]">
          <span className="font-semibold">Step 1.</span> Add what goes in <u>one</u> set. You&apos;ll choose how many sets next.
        </div>

        {products.length > SEARCH_THRESHOLD && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input placeholder="Search this store" className="h-10 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search this store's products" />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-destructive">Couldn&apos;t load this store&apos;s products. Close this and try again.</p>
        ) : products.length === 0 && unlisted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing in this store can be ordered right now.</p>
        ) : (
          <ul className="divide-y">
            {unlisted.map((e) => {
              const d = detailsFor(e);
              if (!d) return null;
              return (
                <li key={`u-${e.productId}`} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{money(d.unitPrice)} · {d.unit} · no longer listed</p>
                  </div>
                  <Stepper value={e.per} onChange={(n) => setPer(e.productId, n)} label={d.name} min={0} />
                </li>
              );
            })}
            {shown.map((p) => {
              const entry = entryFor(p.id);
              const unitId = entry?.unitId ?? unitPick[p.id] ?? defaultUnit(p);
              const price = p.prices.find((x) => x.unit === unitId) ?? p.prices[0];
              return (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.image && <Image src={p.image} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    {p.prices.length > 1 ? (
                      <Select value={String(unitId)} onValueChange={(v) => v && pickUnit(p, Number(v))}>
                        <SelectTrigger className="mt-1 h-8 w-full max-w-44 text-xs" aria-label={`Unit for ${p.name}`}>
                          <SelectValue>{`${price.unitName} — ${money(price.price)}`}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {p.prices.map((x) => (
                            <SelectItem key={x.unit} value={String(x.unit)}>{x.unitName} — {money(x.price)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground">{money(price.price)} · {price.unitName}</p>
                    )}
                  </div>
                  {entry ? (
                    <Stepper value={entry.per} onChange={(n) => setPer(p.id, n)} label={p.name} min={0} />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0 border-[#0058be]/30 bg-[#eff4ff] text-[#0058be] hover:bg-[#dbe7ff]"
                      onClick={() => addProduct(p)}
                    >
                      Add to set
                    </Button>
                  )}
                </li>
              );
            })}
            {shown.length === 0 && unlisted.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">No products match your search.</li>
            )}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t bg-background p-4">
        <div>
          <p className="text-xs text-muted-foreground">One set</p>
          {resolved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet. Tap &ldquo;Add to set&rdquo; on an item above.</p>
          ) : (
            <p className="text-sm">
              {resolved.map((i) => `${i.quantityPerSet} × ${i.name}`).join(' + ')}
              <span className="text-muted-foreground"> · {money(perSetPrice)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <label htmlFor="set-count" className="text-sm"><span className="font-semibold">Step 2.</span> How many sets?</label>
          <div className="inline-flex items-center gap-1.5">
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="Fewer sets" onClick={() => changeSets(sets - 1)} disabled={sets <= 1}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="set-count"
              inputMode="numeric"
              autoComplete="off"
              className="h-9 w-16 text-center tabular-nums"
              value={setsText}
              onChange={(e) => { setError(''); setSetsText(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
              onBlur={() => changeSets(sets || 1)}
            />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="More sets" onClick={() => changeSets(sets + 1)} disabled={sets >= MAX_SETS}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Input
          placeholder="Name it, e.g. Team lunch (optional)"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
          aria-label="Set name (optional)"
        />

        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

        <Button
          type="button"
          className="h-11 w-full bg-[#091426] text-white hover:bg-[#091426]/90"
          disabled={submitting || isLoading || stillLoading}
          onClick={submit}
        >
          {submitting
            ? 'Saving…'
            : editing
              ? 'Save changes'
              : `Add ${sets || 0} ${sets === 1 ? 'set' : 'sets'} to cart${resolved.length >= 2 && sets > 0 ? ` · ${money(perSetPrice * sets)}` : ''}`}
        </Button>
      </div>
    </>
  );
}

export interface BuildSetButtonProps {
  businessId: number;
  businessName?: string;
  /** How loudly the entry point shows itself. */
  appearance?: 'link' | 'outline';
  className?: string;
  label?: string;
  /** Start with this item already in the set. */
  initialItem?: { productId: number; unitId: number };
}

/** Design 2's entry point. Renders nothing unless Design 2 is switched on. */
export function BuildSetButton({
  businessId,
  businessName,
  appearance = 'link',
  className,
  label = 'Build a set',
  initialItem,
}: BuildSetButtonProps) {
  const { design2 } = useSetsVariant();
  const [open, setOpen] = useState(false);
  if (!design2) return null;
  return (
    <>
      {appearance === 'outline' ? (
        <Button type="button" variant="outline" className={cn('gap-2', className)} onClick={() => setOpen(true)}>
          <Layers className="h-4 w-4" aria-hidden="true" />
          {label}
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn('inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#0058be] hover:underline', className)}
        >
          <Layers className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      )}
      <SetBuilderDialog
        businessId={businessId}
        businessName={businessName}
        open={open}
        onOpenChange={setOpen}
        initialItem={initialItem}
      />
    </>
  );
}
