'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PROMO_LIMITS, lagosToday, promoIsLive, type StorefrontDesign, type StorefrontPromo } from '@/lib/storefront/design';
import { Collapse } from './collapse';
import { Field, Panel, Segmented, ToggleRow } from './controls';
import ImageField from './image-field';

const count = (v: string, max: number) => `${v.length}/${max}`;

interface Props {
  design: StorefrontDesign;
  onChange: (design: StorefrontDesign) => void;
  /** Opens the popup in the preview beside (or, on a phone, behind) the editor. */
  onPreview: () => void;
}

/** In plain words: whether shoppers will see it right now, and why not. */
function status(p: StorefrontPromo): string {
  if (!p.enabled) return 'Off. Shoppers don’t see it.';
  const today = lagosToday();
  if (!p.heading.trim() && !p.image.trim()) return 'Add a heading or a picture to show it.';
  if (p.startsAt && today < p.startsAt) return `Starts showing on ${p.startsAt}.`;
  if (p.endsAt && today > p.endsAt) return `Ended on ${p.endsAt}. Change the dates to show it again.`;
  return promoIsLive(p, today) ? 'On. Shoppers see it once published.' : 'Off.';
}

/**
 * The promo popup: a sale, a new collection or a discount code shown over the store as shoppers arrive. They close it
 * and carry on shopping; it comes back only as often as the seller chooses, or when the promo changes.
 */
export default function PromoControls({ design, onChange, onPreview }: Props) {
  const p = design.promo;
  const set = (patch: Partial<StorefrontPromo>) => onChange({ ...design, promo: { ...p, ...patch } });

  return (
    <Panel title="Promo popup" description="Show a sale, a new collection or a discount code as shoppers arrive. They close it and carry on shopping.">
      <ToggleRow
        label="Show the promo popup"
        hint={status(p)}
        control={<Switch aria-label="Show the promo popup" checked={p.enabled} onCheckedChange={(enabled) => set({ enabled })} />}
      />
      <Collapse open={p.enabled}>
        <div className="space-y-3 pt-1">
          <ImageField label="Picture (optional)" value={p.image} onChange={(image) => set({ image })} emptyHint="Without a picture, the popup is just text." />
          <Field label="Heading" counter={count(p.heading, PROMO_LIMITS.heading)}>
            {(id) => <Input id={id} value={p.heading} maxLength={PROMO_LIMITS.heading} onChange={(e) => set({ heading: e.target.value })} placeholder="20% off everything this weekend" />}
          </Field>
          <Field label="Text (optional)" counter={count(p.body, PROMO_LIMITS.body)}>
            {(id) => (
              <Textarea id={id} rows={3} value={p.body} maxLength={PROMO_LIMITS.body} onChange={(e) => set({ body: e.target.value })} placeholder="Ends Sunday at midnight. Delivery across Lagos." />
            )}
          </Field>
          <Field label="Discount code (optional)" hint="Shown with a Copy button. Letters, numbers, dashes and underscores.">
            {(id) => (
              <Input
                id={id}
                value={p.code}
                maxLength={PROMO_LIMITS.code}
                onChange={(e) => set({ code: e.target.value.replace(/\s/g, '').toUpperCase() })}
                placeholder="WEEKEND20"
                autoCapitalize="characters"
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text" counter={count(p.buttonText, PROMO_LIMITS.buttonText)}>
              {(id) => <Input id={id} value={p.buttonText} maxLength={PROMO_LIMITS.buttonText} onChange={(e) => set({ buttonText: e.target.value })} placeholder="Shop now" />}
            </Field>
            <Field label="Button goes to">
              {(id) => <Input id={id} value={p.link} onChange={(e) => set({ link: e.target.value.trim() })} placeholder="/p/sale" inputMode="url" />}
            </Field>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">
            One of your pages (like /p/sale), a product (/products/ and its number) or an https:// link. Leave it empty and the button
            closes the popup so shoppers see your products.
          </p>
          <Field label="Show it on">
            <Segmented
              label="Show it on"
              value={p.showOn}
              onChange={(showOn) => set({ showOn })}
              options={[
                { value: 'home', label: 'Home page' },
                { value: 'all', label: 'Every page', hint: 'Never on the cart or checkout' },
              ]}
            />
          </Field>
          <Field label="After a shopper closes it, show it again" hint="It always shows again when you change the promo.">
            <Segmented
              label="After a shopper closes it, show it again"
              value={p.frequency}
              onChange={(frequency) => set({ frequency })}
              options={[
                { value: 'day', label: 'Next day' },
                { value: 'week', label: 'Next week' },
                { value: 'once', label: 'Only if it changes' },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts (optional)">
              {(id) => <Input id={id} type="date" value={p.startsAt} max={p.endsAt || undefined} onChange={(e) => set({ startsAt: e.target.value })} />}
            </Field>
            <Field label="Ends (optional)">
              {(id) => <Input id={id} type="date" value={p.endsAt} min={p.startsAt || undefined} onChange={(e) => set({ endsAt: e.target.value })} />}
            </Field>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">Dates are in Lagos time and include the start and end days.</p>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={onPreview} disabled={!p.heading.trim() && !p.image.trim()}>
            <Eye className="mr-1.5 h-4 w-4" /> Show it in the preview
          </Button>
        </div>
      </Collapse>
    </Panel>
  );
}
