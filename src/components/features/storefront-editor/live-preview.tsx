'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import type { StorefrontDesign } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { isPreviewMessage, type PreviewMessage } from './preview-protocol';

interface Props {
  slug: string;
  design: StorefrontDesign;
  className?: string;
}

/**
 * The storefront as shoppers will see it, rendered in an iframe so the layout reacts to the real width (phone or
 * desktop). The working design is pushed in with postMessage on every change; nothing is saved by previewing.
 */
export default function LivePreview({ slug, design, className }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(design);
  const [device, setDevice] = useState<'phone' | 'desktop'>('desktop');

  const send = useCallback((d: StorefrontDesign) => {
    const message: PreviewMessage = { type: 'sf-design', design: d };
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  // Push every change to the page.
  useEffect(() => {
    latest.current = design;
    send(design);
  }, [design, send]);

  // The page announces itself when it loads (including after a reload) and gets the current design back.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (isPreviewMessage(e.data) && e.data.type === 'sf-ready') send(latest.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [send]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Live preview</p>
        <div role="radiogroup" aria-label="Preview size" className="inline-flex rounded-lg border bg-background p-0.5">
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
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                device === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
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
          onLoad={() => send(latest.current)}
          className={cn('h-full min-h-[480px] rounded-lg border bg-white shadow-sm transition-[width] duration-200', device === 'phone' ? 'w-[390px] max-w-full' : 'w-full')}
        />
      </div>
    </div>
  );
}
