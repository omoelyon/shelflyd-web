'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Loader2, Lock, MapPin, Package, ShoppingBag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { cn, getApiError } from '@/lib/utils';
import { formatMoney, defaultUnit, headlinePrice } from '@/lib/money';
import { canOptimizeImage } from '@/lib/image';
import { cartApi } from '@/lib/api/cart';
import { authApi } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import { assistantApi } from '@/lib/api/assistant';
import { mergeGuestCartIntoServer } from '@/lib/guest-cart-merge';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import type { Product } from '@/types';
import type { AssistantCartLine, CheckoutQuote, ProposedLine } from '@/types/assistant';
import { SfLink } from '../sf-link';
import { useStorefront } from '../storefront-context';

// ─── Adding to the cart (guest or signed in), shared by the cards ───────────────

interface AddLine {
  productId: number;
  unitId: number;
  quantity: number;
  name: string;
  image: string | null;
  unitName: string;
  unitPrice: number;
  note?: string | null;
}

function useAddToCart() {
  const { info } = useStorefront();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateCart = useCartStore((s) => s.updateCart);
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  const qc = useQueryClient();

  return async (lines: AddLine[]): Promise<boolean> => {
    if (!info) return false;
    if (!isAuthenticated) {
      for (const l of lines) {
        addGuestItem(info.id, {
          productId: l.productId,
          unitId: l.unitId,
          quantity: l.quantity,
          name: l.name,
          type: '',
          image: l.image ?? '',
          unit: l.unitName,
          unitPrice: l.unitPrice,
          note: l.note ?? undefined,
        });
      }
      return true;
    }
    try {
      for (const l of lines) {
        const cart = await cartApi.add({ productId: l.productId, unitId: l.unitId, quantity: l.quantity, note: l.note ?? undefined });
        updateCart(cart);
      }
      await qc.invalidateQueries({ queryKey: ['carts'] });
      return true;
    } catch (error) {
      toast.error(getApiError(error, 'Could not add that to your cart.'));
      await qc.invalidateQueries({ queryKey: ['carts'] });
      return false;
    }
  };
}

const cardShell = 'rounded-2xl border border-border bg-card text-card-foreground shadow-sm';

function Thumb({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground/60', className)} aria-hidden="true">
        <Package className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      <Image src={src} alt={alt} fill sizes="160px" unoptimized={!canOptimizeImage(src)} className="object-cover" />
    </div>
  );
}

// ─── Product cards ────────────────────────────────────────────────────────────

const orderable = (p: Product) => p.status !== 'OUT_OF_STOCK' && p.status !== 'COMING_SOON';

export function ProductsCard({ products, onNavigate }: { products: Product[]; onNavigate?: () => void }) {
  const { slug } = useStorefront();
  const add = useAddToCart();
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const [pending, setPending] = useState<number | null>(null);

  return (
    <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="list" aria-label="Products">
      {products.map((p) => {
        const unit = defaultUnit(p.prices);
        const canAdd = orderable(p) && !!unit;
        return (
          <div key={p.id} role="listitem" className={cn(cardShell, 'flex w-36 shrink-0 snap-start flex-col overflow-hidden')}>
            <SfLink href={`/storefront/${slug}/products/${p.id}`} onClick={onNavigate} className="block">
              <Thumb src={p.image} alt={p.name} className="aspect-square w-full" />
            </SfLink>
            <div className="flex flex-1 flex-col gap-1 p-2.5">
              <SfLink href={`/storefront/${slug}/products/${p.id}`} onClick={onNavigate} className="line-clamp-2 text-[13px] font-medium leading-snug hover:underline">
                {p.name}
              </SfLink>
              <p className="text-[13px] font-semibold tabular-nums text-primary">{headlinePrice(p.prices) ?? ''}</p>
              {!orderable(p) && <p className="text-[11px] text-muted-foreground">{p.status === 'COMING_SOON' ? 'Coming soon' : 'Sold out'}</p>}
              <div className="mt-auto pt-1">
                {canAdd && (
                  <button
                    type="button"
                    disabled={pending === p.id}
                    onClick={async () => {
                      setPending(p.id);
                      const ok = await add([{ productId: p.id, unitId: unit!.unit, quantity: 1, name: p.name, image: p.image, unitName: unit!.unitName, unitPrice: unit!.price }]);
                      setPending(null);
                      if (ok) setAdded((a) => ({ ...a, [p.id]: true }));
                    }}
                    className={cn(
                      'flex h-8 w-full items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors',
                      added[p.id] ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground hover:opacity-90',
                    )}
                  >
                    {pending === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : added[p.id] ? <><Check className="h-3.5 w-3.5" /> Added</> : `Add ${unit!.unitName ? `· ${unit!.unitName}` : ''}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Proposed cart ────────────────────────────────────────────────────────────

export function CartCard({ lines, total, onCheckout }: { lines: ProposedLine[]; total: number; onCheckout: () => void }) {
  const add = useAddToCart();
  const [state, setState] = useState<'open' | 'adding' | 'added' | 'dismissed'>('open');
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  if (state === 'added' || state === 'dismissed') {
    return (
      <div className={cn(cardShell, 'flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5')}>
        <p className="flex flex-1 items-center gap-1.5 text-[13px] text-muted-foreground">
          {state === 'added' ? <Check className="h-4 w-4 text-primary" /> : null}
          {state === 'added' ? `Added ${count} item${count === 1 ? '' : 's'} · ${formatMoney(total)}` : 'Not added'}
        </p>
        {state === 'added' && (
          <button type="button" onClick={onCheckout} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            Checkout
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(cardShell, 'overflow-hidden')}>
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
        <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" />
        <p className="text-[13px] font-semibold">Ready for your cart</p>
      </div>
      <ul className="divide-y divide-border">
        {lines.map((l) => (
          <li key={`${l.productId}-${l.unitId}`} className="flex items-center gap-2.5 px-3.5 py-2">
            <Thumb src={l.image} alt="" className="h-9 w-9 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{l.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {l.quantity} × {l.unitName} · {formatMoney(l.unitPrice)}
                {l.note ? ` · “${l.note}”` : ''}
              </p>
            </div>
            <p className="text-[13px] font-semibold tabular-nums">{formatMoney(l.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-3.5 py-2.5">
        <p className="text-[13px]">
          <span className="text-muted-foreground">Items </span>
          <span className="font-semibold tabular-nums">{formatMoney(total)}</span>
        </p>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setState('dismissed')} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
            Not now
          </button>
          <button
            type="button"
            disabled={state === 'adding'}
            onClick={async () => {
              setState('adding');
              const ok = await add(lines.map((l) => ({ ...l })));
              setState(ok ? 'added' : 'open');
              if (ok) toast.success('Added to your cart');
            }}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {state === 'adding' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

const field = 'h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export function CheckoutCard({ initial, cart }: { initial: CheckoutQuote; cart: () => AssistantCartLine[] }) {
  const { slug } = useStorefront();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [quote, setQuote] = useState<CheckoutQuote>(initial);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showLines, setShowLines] = useState(initial.lines.length <= 3);
  const [contact, setContact] = useState({ name: '', phone: '', address: '' });
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      setContact((c) => ({
        name: c.name || [user.firstName, user.lastName].filter(Boolean).join(' '),
        phone: c.phone || user.phone || '',
        address: c.address,
      }));
    }
  }, [user]);

  const refresh = async (fulfilment: 'pickup' | 'delivery', areaId: number | null) => {
    setLoading(true);
    try {
      setQuote(await assistantApi.quote(slug, { fulfilment, areaId, cart: cart() }));
    } catch (error) {
      toast.error(getApiError(error, 'Could not update the total.'));
    } finally {
      setLoading(false);
    }
  };


  const delivering = quote.fulfilment === 'delivery';
  const canDeliver = quote.areas.length > 0 || quote.courierAvailable;
  const needsContact = delivering && !quote.courierOnly;
  const contactOk = !needsContact || (contact.name.trim() && contact.phone.trim().length >= 7 && contact.address.trim().length >= 5);

  const pay = async () => {
    if (!isAuthenticated) {
      setSigningIn(true);
      return;
    }
    setPaying(true);
    try {
      const fresh = await assistantApi.quote(slug, { fulfilment: quote.fulfilment, areaId: quote.areaId, cart: [] });
      setQuote(fresh);
      if (fresh.problem || !fresh.cartId) {
        toast.error(fresh.problem ?? 'Your cart is empty.');
        return;
      }
      if (fresh.total !== quote.total) {
        toast.message(`Your total changed to ${formatMoney(fresh.total)}. Check it and tap Pay again.`);
        return;
      }
      if (fresh.courierOnly && delivering) {
        window.location.assign(`/storefront/${slug}/checkout?cartId=${fresh.cartId}`);
        return;
      }
      const result = await cartApi.checkout({
        cartId: fresh.cartId,
        orderType: delivering ? 'DELIVERY' : 'PICKUP',
        locationId: delivering ? fresh.areaId ?? undefined : undefined,
        contactName: needsContact ? contact.name.trim() : undefined,
        contactPhone: needsContact ? contact.phone.trim() : undefined,
        addressLine: needsContact ? contact.address.trim() : undefined,
      });
      window.location.href = result.url;
    } catch (error) {
      toast.error(getApiError(error, 'Could not start payment. Try again.'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={cn(cardShell, 'overflow-hidden')}>
      <button
        type="button"
        onClick={() => setShowLines((s) => !s)}
        className="flex w-full items-center gap-2 border-b border-border px-3.5 py-2.5 text-left"
        aria-expanded={showLines}
      >
        <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="flex-1 text-[13px] font-semibold">
          Your order · {quote.lines.length} item{quote.lines.length === 1 ? '' : 's'}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showLines && 'rotate-180')} />
      </button>
      {showLines && (
        <ul className="divide-y divide-border">
          {quote.lines.map((l) => (
            <li key={`${l.productId}-${l.unit}`} className="flex items-center justify-between gap-3 px-3.5 py-1.5 text-[13px]">
              <span className="min-w-0 truncate">
                {Number(l.quantity)} × {l.name} <span className="text-muted-foreground">({l.unit})</span>
              </span>
              <span className="tabular-nums">{formatMoney(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2.5 border-t border-border px-3.5 py-3">
        {canDeliver && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Pickup or delivery">
            {(['pickup', 'delivery'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={quote.fulfilment === mode}
                disabled={loading}
                onClick={() => mode !== quote.fulfilment && refresh(mode, mode === 'delivery' ? quote.areaId ?? quote.areas[0]?.id ?? null : null)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors',
                  quote.fulfilment === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode === 'pickup' ? <MapPin className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                {mode === 'pickup' ? 'Pickup' : 'Delivery'}
              </button>
            ))}
          </div>
        )}
        {!delivering && (
          <p className="text-xs text-muted-foreground">
            {quote.pickupAddress ? <>Pick up at <span className="text-foreground">{quote.pickupAddress}</span>. You’ll get a pickup code.</> : 'Collect from the store. You’ll get a pickup code.'}
          </p>
        )}
        {delivering && quote.courierOnly && (
          <p className="text-xs text-muted-foreground">Delivered by courier. You’ll enter your address and choose a rate on the next page.</p>
        )}
        {delivering && !quote.courierOnly && quote.areas.length > 0 && (
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Deliver to
              <select
                className={cn(field, 'mt-1')}
                value={quote.areaId ?? ''}
                disabled={loading}
                onChange={(e) => refresh('delivery', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Choose an area</option>
                {quote.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatMoney(a.fee)}
                  </option>
                ))}
              </select>
            </label>
            <input className={field} placeholder="Your name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            <input className={field} placeholder="Phone number" type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            <input className={field} placeholder="Street address" autoComplete="street-address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          </div>
        )}
      </div>

      <dl className="space-y-1 border-t border-border px-3.5 py-2.5 text-[13px]">
        <Row label="Items" value={quote.subtotal} />
        {delivering && !quote.courierOnly && <Row label="Delivery" value={quote.deliveryFee} />}
        {quote.serviceFee > 0 && <Row label="Service fee" value={quote.serviceFee} />}
        {quote.processingFee > 0 && <Row label="Payment processing" value={quote.processingFee} />}
        <div className="flex items-center justify-between border-t border-border pt-1.5 text-sm font-bold">
          <dt>Total{delivering && quote.courierOnly ? ' before delivery' : ''}</dt>
          <dd className="tabular-nums">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatMoney(quote.total)}</dd>
        </div>
      </dl>

      <div className="border-t border-border px-3.5 py-3">
        {quote.problem && <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">{quote.problem}</p>}
        {signingIn && !isAuthenticated ? (
          <InlineSignIn
            onDone={() => {
              setSigningIn(false);
              // The guest cart has moved to the account by now; work the total out again from there.
              refresh(quote.fulfilment, quote.areaId);
            }}
          />
        ) : (
          <button
            type="button"
            disabled={paying || loading || !!quote.problem || !contactOk}
            onClick={pay}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {!isAuthenticated ? 'Sign in to pay' : delivering && quote.courierOnly ? 'Continue to delivery' : `Pay ${formatMoney(quote.total)}`}
          </button>
        )}
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Payment happens on Paystack’s secure page. Nothing is charged until you pay there.</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{formatMoney(value)}</dd>
    </div>
  );
}

/** Sign in without leaving the chat: the guest cart moves to the account and the checkout card updates. */
function InlineSignIn({ onDone }: { onDone: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { token } = await authApi.login({ email: email.trim(), password });
      await fetch('/api/auth/set-cookie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      setUser(await usersApi.me());
      await mergeGuestCartIntoServer();
      await qc.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Signed in. Check your total and pay.');
      onDone();
    } catch (error) {
      toast.error(getApiError(error, 'That email and password didn’t match.'));
    } finally {
      setBusy(false);
    }
  };

  const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
  return (
    <form onSubmit={submit} className="space-y-2" aria-label="Sign in to pay">
      <p className="text-xs font-medium">Sign in to pay. Your cart comes with you.</p>
      <input className={field} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={field} type="password" required placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={busy} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
      <p className="text-center text-[11px] text-muted-foreground">
        New here?{' '}
        <a className="font-medium text-primary underline-offset-2 hover:underline" href={`/auth/register?from=${encodeURIComponent(here)}`}>
          Create an account
        </a>
      </p>
    </form>
  );
}
