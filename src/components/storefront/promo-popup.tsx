'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { Check, Copy, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { promoDue, promoIsLive, promoSignature, readableTextOn, themeCssVars } from '@/lib/storefront/design';
import SafeImage from './sections/safe-image';
import SectionLink from './sections/section-link';
import { useActivePage, useStorefront } from './storefront-context';

/** How long after the page shows before the popup opens, so the store itself is seen first. */
const OPEN_DELAY_MS = 1200;

type Dismissed = { sig: string; at: number };

function readDismissed(key: string): Dismissed | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? 'null') as Dismissed | null;
    return v && typeof v.sig === 'string' && typeof v.at === 'number' ? v : null;
  } catch {
    return null; // storage blocked (private window): the popup simply shows once per page load
  }
}

/**
 * The seller's promo popup (a sale, a new collection, a discount code). On the live store it opens shortly after a
 * shopper arrives, if it is switched on and within its dates, on the pages the seller chose (never the cart or
 * checkout), and only if this shopper hasn't closed it recently. Closing it, or pressing its button, is remembered
 * in their browser; a changed promo shows again. In the editor's preview it opens when the editor asks.
 */
export default function PromoPopup() {
  const { slug, design, preview, promoPreview } = useStorefront();
  const promo = design.promo;
  const activePage = useActivePage();
  const pathname = usePathname();
  const storageKey = `sf-promo:${slug}`;
  const [liveOpen, setLiveOpen] = useState(false);
  // Preview: the editor sends a new number each time it wants the popup shown; closing remembers which one.
  const [closedPreview, setClosedPreview] = useState(0);
  const [copied, setCopied] = useState(false);

  const onCheckout = /\/(cart|checkout)(\/|$)/.test(pathname);
  const rightPage = promo.showOn === 'all' || activePage === 'home';
  const signature = promoSignature(promo);

  useEffect(() => {
    if (preview || onCheckout || !rightPage || !promoIsLive(promo)) return;
    if (!promoDue(promo, readDismissed(storageKey))) return;
    const timer = window.setTimeout(() => setLiveOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
    // Re-checked when the shopper moves between pages or the promo itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, onCheckout, rightPage, signature, promo.enabled, promo.startsAt, promo.endsAt, promo.frequency, storageKey]);

  const open = preview ? promoPreview > 0 && promoPreview !== closedPreview : liveOpen;

  const dismiss = () => {
    if (preview) {
      setClosedPreview(promoPreview);
      return;
    }
    setLiveOpen(false);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ sig: signature, at: Date.now() } satisfies Dismissed));
    } catch {
      // storage blocked: nothing to remember
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked: the code is on screen to copy by hand
    }
  };

  // The preview scopes the theme to its frame, and this popup renders outside it, so it carries the theme itself.
  const themed = preview ? (themeCssVars(design.theme) as CSSProperties) : undefined;
  const buttonStyle: CSSProperties = { backgroundColor: design.theme.primary, color: readableTextOn(design.theme.primary) };
  const buttonClass =
    'inline-flex h-11 w-full items-center justify-center rounded-[var(--radius)] px-5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]';
  const label = promo.buttonText.trim() || 'Shop now';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent
        showCloseButton={false}
        style={{ ...themed, fontFamily: 'var(--sf-body-font, var(--font-inter))' }}
        className="top-auto bottom-0 max-w-full translate-y-0 gap-0 overflow-hidden rounded-b-none p-0 data-open:slide-in-from-bottom-8 sm:top-1/2 sm:bottom-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-[calc(var(--radius)+0.5rem)] sm:data-open:slide-in-from-bottom-0"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          <X className="h-4 w-4" />
        </button>
        {promo.image && (
          <div className="relative aspect-[16/9] w-full bg-muted">
            <SafeImage src={promo.image} alt="" sizes="(min-width: 640px) 448px, 100vw" />
          </div>
        )}
        <div className="space-y-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
          {promo.heading && (
            <DialogTitle className="pr-8 text-xl font-bold leading-snug text-foreground" style={{ fontFamily: 'var(--sf-heading-font, var(--font-manrope))' }}>
              {promo.heading}
            </DialogTitle>
          )}
          {promo.body && <DialogDescription className="text-sm leading-relaxed text-muted-foreground">{promo.body}</DialogDescription>}
          {promo.code && (
            <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-dashed border-[var(--primary)]/50 bg-[var(--primary)]/5 px-3 py-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Use code</p>
                <p className="font-mono text-base font-bold tracking-wider text-foreground">{promo.code}</p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10"
                aria-live="polite"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
          <div className="space-y-1.5 pt-1">
            {promo.link ? (
              <div onClickCapture={dismiss}>
                <SectionLink href={promo.link} className={buttonClass} style={buttonStyle}>
                  {label}
                </SectionLink>
              </div>
            ) : (
              <button type="button" onClick={dismiss} className={buttonClass} style={buttonStyle}>
                {label}
              </button>
            )}
            <button type="button" onClick={dismiss} className="w-full py-1.5 text-center text-xs font-medium text-muted-foreground hover:text-foreground">
              No thanks
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
