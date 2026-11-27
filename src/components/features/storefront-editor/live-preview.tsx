'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { StorefrontDesign } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { isPreviewMessage, type PreviewMessage, type PreviewPage } from './preview-protocol';

interface Props {
  slug: string;
  design: StorefrontDesign;
  /** The page to show; the preview opens on the home page. */
  page?: PreviewPage;
  className?: string;
  /** Ask the preview to show the promo popup: a new number each time (0 = not asked). */
  promoPreview?: number;
}

/**
 * The storefront as shoppers will see it, rendered in an iframe so the layout reacts to the real width (phone or
 * desktop). The working design is pushed in with postMessage on every change; nothing is saved by previewing.
 */
export default function LivePreview({ slug, design, page = 'home', className, promoPreview = 0 }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(design);
  const latestPage = useRef<PreviewPage>(page);
  const [device, setDevice] = useState<'phone' | 'desktop'>('desktop');
  const [loaded, setLoaded] = useState(false);

  const post = useCallback((message: PreviewMessage) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const send = useCallback(
    (d: StorefrontDesign) => {
      post({ type: 'sf-design', design: d });
      post({ type: 'sf-page', page: latestPage.current });
    },
    [post],
  );

  // The editor asked to see the promo popup. Kept so a frame that loads afterwards (a phone switching to the
  // Preview tab) still opens it once it says it is ready.
  const latestPromo = useRef(promoPreview);
  useEffect(() => {
    latestPromo.current = promoPreview;
    if (promoPreview > 0) post({ type: 'sf-promo', open: promoPreview });
  }, [promoPreview, post]);

  // Push every change to the page.
  useEffect(() => {
    latest.current = design;
    send(design);
  }, [design, send]);

  // Switching page only needs the page message; the frame softly dips and returns so the swap doesn't feel like a jump.
  const firstPage = useRef(true);
  useEffect(() => {
    latestPage.current = page;
    post({ type: 'sf-page', page });
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    const el = frame.current;
    if (el && typeof el.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.animate([{ opacity: 0.35, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  }, [page, post]);

  // The page announces itself when it loads (including after a reload) and gets the current design back.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (isPreviewMessage(e.data) && e.data.type === 'sf-ready') {
        send(latest.current);
        if (latestPromo.current > 0) post({ type: 'sf-promo', open: latestPromo.current });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [send, post]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Live preview</p>
        <div role="radiogroup" aria-label="Preview size" className="relative inline-grid grid-cols-2 rounded-lg border bg-background p-0.5">
          {/* The highlighted pill glides between the two choices. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-primary shadow-sm transition-transform duration-300 ease-(--ease-in-out)',
              device === 'desktop' && 'translate-x-full',
            )}
          />
          {(
            [
              { value: 'phone', label: 'Phone', Icon: Smartphone },
              { value: 'desktop', label: 'Desktop', Icon: Monitor },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={device === value}
              onClick={() => setDevice(value)}
              className={cn(
                'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium outline-none transition-colors duration-300 ease-(--ease-out) focus-visible:ring-3 focus-visible:ring-ring/50',
                device === value ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden rounded-xl border bg-muted/40 p-2">
        <iframe
          ref={frame}
          title="Storefront preview"
          src={`/storefront-preview?slug=${encodeURIComponent(slug)}`}
          onLoad={() => {
            send(latest.current);
            setLoaded(true);
          }}
          className={cn(
            'h-full min-h-[480px] rounded-lg border bg-white shadow-sm transition-[width,opacity] duration-500 ease-(--ease-in-out)',
            device === 'phone' ? 'w-[390px] max-w-full' : 'w-full',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
    </div>
  );
}
