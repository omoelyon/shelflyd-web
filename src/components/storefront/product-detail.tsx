'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import QuantityField from '@/components/ui/quantity-field';
import { cn, formatStatus, getApiError } from '@/lib/utils';
import { BuildSetButton } from '@/components/features/cart-sets/set-builder-dialog';
import ProductGallery from '@/components/features/products/product-gallery';
import { productImages } from '@/lib/product-images';
import { storefrontViewPath, useTrackProductView } from '@/lib/use-track-product-view';
import type { Product } from '@/types';
import { useCartDrawer } from './cart-drawer-store';
import { stagger } from './motion';
import { SfLink } from './sf-link';
import { useStorefront } from './storefront-context';

/**
 * The body of a storefront product page: photo, name, status, unit and price, quantity, note and the add-to-cart
 * button. The design chooses the layout (photo beside the details, or a large photo above them) and the photo
 * shape. In the editor's preview (`preview` in the storefront context) nothing is sent to any cart.
 */
export default function ProductDetail({ product }: { product: Product }) {
  const { slug, info, design, preview } = useStorefront();
  const { layout, imageRatio } = design.pages.product;
  const stacked = layout === 'stacked';
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const updateCart = useCartStore((s) => s.updateCart);
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  // The preview starts on the first unit so the price shows; a live shopper still chooses one.
  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => (preview && product.prices?.[0] ? String(product.prices[0].unit) : ''));
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const id = product.id;
  // The editor's preview shows sample data, so it never counts as a visit.
  useTrackProductView(preview ? null : storefrontViewPath(slug, id));

  // After a successful add the button shows a brief "Added" tick, then goes back to normal. It stays clickable.
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
    },
    [],
  );

  const afterAdded = () => {
    setJustAdded(true);
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), 1600);
    toast.success('Added to cart!', { action: { label: 'View Cart', onClick: () => router.push(`/storefront/${slug}/cart`) } });
    setNote('');
    // With the slide-in cart, show the shopper what they just added.
    if (design.pages.cart.style === 'drawer' && !preview) useCartDrawer.getState().setOpen(true);
  };

  const addToCart = useMutation({
    mutationFn: () =>
      cartApi.add({
        productId: id,
        unitId: Number(selectedUnitId),
        quantity,
        note: note.trim() || undefined,
      }),
    onSuccess: (cart) => {
      updateCart(cart);
      // The cart drawer (and the cart page) read the cached cart list, so refresh it or they show the cart as it was.
      qc.invalidateQueries({ queryKey: ['carts'] });
      afterAdded();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to add to cart.')),
  });

  const selectedPrice = product.prices?.find((p) => p.unit === Number(selectedUnitId));

  const handleAddToCart = () => {
    if (preview) return;
    if (isAuthenticated) {
      addToCart.mutate();
      return;
    }
    if (!info || !selectedPrice) return;
    addGuestItem(info.id, {
      productId: id,
      unitId: Number(selectedUnitId),
      quantity,
      name: product.name,
      type: product.type,
      image: product.image,
      unit: selectedPrice.unitName,
      unitPrice: selectedPrice.price,
      note: note.trim() || undefined,
    });
    afterAdded();
  };

  // The gallery shows every photo (a photo that fails to load falls back to a neutral block there). Beside the details
  // the photo stays at the top instead of stretching to the height of a long column.
  const image = (
    <ProductGallery
      images={productImages(product)}
      alt={product.name}
      ratio={imageRatio}
      inert={preview}
      className={cn('sf-scale-in', !stacked && 'self-start')}
    />
  );

  const heading = (
    <div className={cn('sf-rise', stacked && 'text-center')} style={stagger(1)}>
      <div className={cn('flex items-center gap-2 mb-1', stacked && 'justify-center')}>
        {product.type && <Badge variant="outline">{product.type}</Badge>}
        <Badge
          variant="secondary"
          className={
            product.status === 'IN_STOCK' ? 'bg-green-100 text-green-700'
            : product.status === 'LOW_STOCK' ? 'bg-orange-100 text-orange-700'
            : product.status === 'COMING_SOON' ? 'bg-blue-100 text-blue-700'
            : 'bg-red-100 text-red-700'
          }
        >
          {product.status === 'OUT_OF_STOCK' ? 'Sold out' : formatStatus(product.status)}
        </Badge>
      </div>
      <h1 className="text-3xl font-bold">{product.name}</h1>
      {product.description && <p className="text-muted-foreground mt-2">{product.description}</p>}
    </div>
  );

  const buyable = product.status === 'IN_STOCK' || product.status === 'LOW_STOCK';

  const details = (
    <div className="space-y-5">
      {heading}

      {/* Unit + price selection */}
      {product.prices?.length > 0 && (
        <div className="sf-rise space-y-3" style={stagger(2)}>
          <label className="text-sm font-medium">Select Unit</label>
          <Select value={selectedUnitId} onValueChange={(v) => setSelectedUnitId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a unit...">
                {selectedPrice ? `${selectedPrice.unitName} — ${selectedPrice.currency} ${selectedPrice.price.toLocaleString()}` : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {product.prices.map((p) => (
                <SelectItem key={p.unit} value={String(p.unit)}>
                  {p.unitName} — {p.currency} {p.price.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPrice && (
            // Keyed by the unit so the price softly fades in again when the shopper switches unit.
            <p key={selectedPrice.unit} className="sf-fade-in text-2xl font-bold tabular-nums text-primary">
              {selectedPrice.currency} {selectedPrice.price.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="sf-rise flex items-center gap-3" style={stagger(3)}>
        <label className="text-sm font-medium">Qty:</label>
        {/* Step with the buttons, or just type the amount. */}
        <QuantityField value={quantity} onChange={setQuantity} label="quantity" />
      </div>

      {/* Note */}
      <div className="sf-rise space-y-1.5" style={stagger(4)}>
        <label className="text-sm font-medium">Note (optional)</label>
        <Textarea
          placeholder="Ripeness preference, delivery instructions for this item…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
        />
      </div>

      {/* Add to cart. In the preview it looks live but does nothing. */}
      <div className="sf-rise" style={stagger(5)}>
      <Button
        className="w-full bg-primary text-primary-foreground transition-[opacity,scale] duration-200 hover:opacity-90 active:scale-[0.98]"
        size="lg"
        disabled={!preview && (!selectedUnitId || !buyable || addToCart.isPending)}
        aria-disabled={preview || undefined}
        onClick={handleAddToCart}
      >
        {justAdded && !addToCart.isPending ? (
          <Check className="sf-pop mr-2 h-4 w-4" aria-hidden="true" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        <span aria-live="polite">
          {addToCart.isPending ? 'Adding...' : justAdded ? 'Added' : product.status === 'OUT_OF_STOCK' ? 'Sold out' : 'Add to Cart'}
        </span>
      </Button>
      </div>
      {buyable && product.prices?.length > 0 && (
        <div className="text-center">
          {preview ? (
            <span className="text-sm font-medium text-primary">Add to a set</span>
          ) : (
            <BuildSetButton
              businessId={product.businessId}
              businessName={info?.name}
              label="Add to a set"
              initialItem={{ productId: product.id, unitId: selectedUnitId ? Number(selectedUnitId) : product.prices[0].unit }}
            />
          )}
        </div>
      )}
      {product.status === 'OUT_OF_STOCK' && (
        <p className="text-xs text-center text-muted-foreground">This item is sold out right now. Check back soon.</p>
      )}
      {!product.prices?.length && (
        <p className="text-xs text-center text-muted-foreground">
          This item isn&apos;t available for purchase yet — the seller hasn&apos;t set a price.
        </p>
      )}
    </div>
  );

  return (
    <div className={cn('mx-auto px-4 py-10', stacked ? 'max-w-3xl' : 'max-w-5xl')}>
      <SfLink
        href={`/storefront/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to store
      </SfLink>

      {stacked ? (
        <div className="space-y-8">
          {image}
          <div className="mx-auto max-w-xl">{details}</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-10">
          {image}
          {details}
        </div>
      )}
    </div>
  );
}
