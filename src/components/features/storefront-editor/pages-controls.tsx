'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import type { CartSettings, ProductPageSettings, StorefrontDesign } from '@/lib/storefront/design';
import { LIMITS, setCart, setProductPage } from '@/lib/storefront/editor-model';
import { Field, Panel, Segmented, type Option } from './controls';

interface Props {
  design: StorefrontDesign;
  onChange: (next: StorefrontDesign) => void;
}

// ─── tiny schematics (decorative: the label next to them carries the meaning) ─────

const block = 'rounded-[2px] bg-muted-foreground/30';

/** A mini page: a photo and a few text lines, side by side or stacked. */
function LayoutDiagram({ layout }: { layout: ProductPageSettings['layout'] }) {
  return (
    <span aria-hidden="true" className={layout === 'split' ? 'mx-auto flex h-10 w-16 gap-1.5' : 'mx-auto flex h-10 w-16 flex-col gap-1'}>
      <span className={`${block} ${layout === 'split' ? 'h-full w-1/2' : 'h-5 w-full'}`} />
      <span className={`flex flex-1 flex-col justify-center gap-1 ${layout === 'stacked' ? 'items-center' : ''}`}>
        <span className={`${block} h-1.5 w-full`} />
        <span className={`${block} h-1.5 w-2/3`} />
        {layout === 'split' && <span className="h-2 w-full rounded-[2px] bg-primary/60" />}
      </span>
    </span>
  );
}

function RatioDiagram({ ratio }: { ratio: ProductPageSettings['imageRatio'] }) {
  const size = { square: 'h-8 w-8', portrait: 'h-10 w-[30px]', wide: 'h-6 w-11' }[ratio];
  return (
    <span aria-hidden="true" className="mx-auto flex h-10 items-center justify-center">
      <span className={`${block} ${size}`} />
    </span>
  );
}

function CartDiagram({ style }: { style: CartSettings['style'] }) {
  return (
    <span aria-hidden="true" className="relative mx-auto block h-10 w-16 overflow-hidden rounded-[3px] border border-muted-foreground/30">
      {style === 'drawer' ? (
        <>
          <span className="absolute inset-0 bg-muted-foreground/10" />
          <span className="absolute inset-y-0 right-0 flex w-7 flex-col justify-center gap-1 border-l border-muted-foreground/30 bg-background px-1">
            <span className={`${block} h-1.5 w-full`} />
            <span className={`${block} h-1.5 w-full`} />
            <span className="h-2 w-full rounded-[2px] bg-primary/60" />
          </span>
        </>
      ) : (
        <span className="absolute inset-x-3 inset-y-1 flex flex-col justify-center gap-1">
          <span className={`${block} h-1.5 w-full`} />
          <span className={`${block} h-1.5 w-full`} />
          <span className="ml-auto h-2 w-1/2 rounded-[2px] bg-primary/60" />
        </span>
      )}
    </span>
  );
}

function Choice({ diagram, title, description }: { diagram: ReactNode; title: string; description?: string }) {
  return (
    <span className="block space-y-1.5 py-0.5">
      {diagram}
      <span className="block text-xs font-medium">{title}</span>
      {description && <span className="block text-[11px] font-normal leading-snug text-muted-foreground">{description}</span>}
    </span>
  );
}

// ─── Product page ────────────────────────────────────────────────────────────

const LAYOUTS: Option<ProductPageSettings['layout']>[] = [
  { value: 'split', label: 'Side by side', render: <Choice diagram={<LayoutDiagram layout="split" />} title="Side by side" /> },
  { value: 'stacked', label: 'Stacked', render: <Choice diagram={<LayoutDiagram layout="stacked" />} title="Stacked" /> },
];

const RATIOS: Option<ProductPageSettings['imageRatio']>[] = [
  { value: 'square', label: 'Square', render: <Choice diagram={<RatioDiagram ratio="square" />} title="Square" /> },
  { value: 'portrait', label: 'Portrait', render: <Choice diagram={<RatioDiagram ratio="portrait" />} title="Portrait" /> },
  { value: 'wide', label: 'Wide', render: <Choice diagram={<RatioDiagram ratio="wide" />} title="Wide" /> },
];

/** How every product page is laid out: photo placement and photo shape. */
export function ProductPageControls({ design, onChange }: Props) {
  const { layout, imageRatio } = design.pages.product;
  return (
    <Panel title="Product page" description="How each product looks when a shopper opens it. It applies to every product.">
      <Field label="Layout" hint={layout === 'split' ? 'Photo on one side, details on the other.' : 'A large photo on top, details underneath.'}>
        <Segmented label="Product page layout" value={layout} options={LAYOUTS} onChange={(v) => onChange(setProductPage(design, { layout: v }))} />
      </Field>
      <Field label="Photo shape" hint="Photos are cropped to fit, so pick the shape that suits your products.">
        <Segmented label="Product photo shape" value={imageRatio} options={RATIOS} onChange={(v) => onChange(setProductPage(design, { imageRatio: v }))} />
      </Field>
    </Panel>
  );
}

// ─── Cart ────────────────────────────────────────────────────────────────────

const CART_STYLES: Option<CartSettings['style']>[] = [
  {
    value: 'page',
    label: 'Full page',
    render: <Choice diagram={<CartDiagram style="page" />} title="Full page" description="Shoppers go to a cart page to review and check out." />,
  },
  {
    value: 'drawer',
    label: 'Slide-in drawer',
    render: <Choice diagram={<CartDiagram style="drawer" />} title="Slide-in drawer" description="Shoppers keep browsing while the cart slides in." />,
  },
];

/** How the cart appears, and an optional note shoppers see at the top of it. */
export function CartControls({ design, onChange }: Props) {
  const { style, message } = design.pages.cart;
  return (
    <Panel title="Cart" description="What shoppers see after they add something. Checkout works the same either way.">
      <Field label="Cart style">
        <Segmented label="Cart style" value={style} options={CART_STYLES} onChange={(v) => onChange(setCart(design, { style: v }))} />
      </Field>
      <Field
        label="Message in the cart"
        counter={`${message.length}/${LIMITS.cartMessage}`}
        hint="Optional. For example “Delivery takes 1–2 days” or “Orders before 2pm ship today”."
      >
        {(id) => (
          <Input
            id={id}
            value={message}
            maxLength={LIMITS.cartMessage}
            placeholder="Delivery takes 1–2 days"
            onChange={(e) => onChange(setCart(design, { message: e.target.value }))}
          />
        )}
      </Field>
    </Panel>
  );
}
