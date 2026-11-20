'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TEMPLATES, type StorefrontTemplate } from '@/lib/storefront/templates';
import { designsEqual } from '@/lib/storefront/editor-model';
import type { StorefrontDesign } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { Panel } from './controls';
import DesignThumbnail from './design-thumbnail';

interface Props {
  design: StorefrontDesign;
  onApply: (design: StorefrontDesign) => void;
}

/**
 * Templates only define the look and the home page. The seller's extra pages, product page and cart settings are
 * theirs, so applying a template carries them over (and comparing designs below therefore ignores them too).
 */
function withSellerPages(current: StorefrontDesign, built: StorefrontDesign): StorefrontDesign {
  const { product, cart, custom } = current.pages;
  return { ...built, pages: { ...built.pages, product, cart, custom } };
}

/**
 * Cards for each ready-made template. Applying one rebuilds the layout with the seller's own brand colour; if that
 * would throw away edits (the design isn't exactly what the template produces) it asks first.
 */
export default function TemplatePicker({ design, onApply }: Props) {
  const primary = design.theme.primary;
  const [pending, setPending] = useState<StorefrontTemplate | null>(null);

  const choose = (t: StorefrontTemplate) => {
    const built = withSellerPages(design, t.build(primary));
    if (designsEqual(design, built)) return;
    // Switching from a layout that is still untouched (exactly some template) needs no warning.
    const untouched = TEMPLATES.some((other) => designsEqual(design, withSellerPages(design, other.build(primary))));
    if (untouched) onApply(built);
    else setPending(t);
  };

  return (
    <Panel title="Template" description="Start from a ready-made layout. You can change everything afterwards.">
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => {
          const built = t.build(primary);
          const current = designsEqual(design, withSellerPages(design, built));
          const based = !current && design.template === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t)}
              aria-pressed={current}
              className={cn(
                'sf-press sf-lift group rounded-xl border bg-card p-2 text-left outline-none transition-[border-color,box-shadow,transform] duration-300 ease-(--ease-out) focus-visible:ring-3 focus-visible:ring-ring/50',
                current ? 'border-primary ring-1 ring-primary' : 'hover:border-foreground/30',
              )}
            >
              <DesignThumbnail design={built} />
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-sm font-semibold">{t.name}</span>
                {current && <Check className="sf-pop h-3.5 w-3.5 text-primary" aria-label="Current layout" />}
                {based && <span className="animate-in fade-in-0 zoom-in-95 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Customised</span>}
              </div>
              <p className="text-xs text-muted-foreground">{t.tagline}</p>
              <p className="mt-1 text-[11px] font-medium text-foreground/70">Best for: {t.bestFor}</p>
            </button>
          );
        })}
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Replace your current layout?</DialogTitle>
            <DialogDescription>
              {pending
                ? `Switching to ${pending.name} resets the layout and the text and photos in your home page sections. Your brand colour${
                    design.pages.custom.length > 0 ? ', extra pages' : ''
                  } and cart and product page settings stay.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPending(null)}>
              Keep my layout
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pending) onApply(withSellerPages(design, pending.build(primary)));
                setPending(null);
              }}
            >
              Use {pending?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
