'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatStatus, getApiError } from '@/lib/utils';
import { BuildSetButton } from '@/components/features/cart-sets/set-builder-dialog';
import type { Product } from '@/types';
import { useCartDrawer } from './cart-drawer-store';
import { SfLink } from './sf-link';
import { useStorefront } from './storefront-context';

const RATIO_CLASS = { square: 'aspect-square', portrait: 'aspect-[3/4]', wide: 'aspect-video' } as const;

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
  // SHF-16: fall back gracefully if the product's image URL doesn't actually resolve.
  const [imageFailed, setImageFailed] = useState(false);
  const id = product.id;

  const afterAdded = () => {
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

  const image = (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-muted',
        RATIO_CLASS[imageRatio],
        // Beside the details the photo stays at the top instead of stretching to the height of a long column.
        !stacked && 'self-start',
      )}
    >
      {product.image && !imageFailed ? (
        <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized onError={() => setImageFailed(true)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No image</div>
      )}
    </div>
  );

  const heading = (
    <div className={cn(stacked && 'text-center')}>
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
        <div className="space-y-3">
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
            <p className="text-2xl font-bold text-primary">
              {selectedPrice.currency} {selectedPrice.price.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Qty:</label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            -
          </Button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <Button variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>
            +
          </Button>
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
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
      <Button
        className="w-full bg-primary text-primary-foreground hover:opacity-90"
        size="lg"
        disabled={!preview && (!selectedUnitId || !buyable || addToCart.isPending)}
        aria-disabled={preview || undefined}
        onClick={handleAddToCart}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        {addToCart.isPending ? 'Adding...' : product.status === 'OUT_OF_STOCK' ? 'Sold out' : 'Add to Cart'}
      </Button>
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
