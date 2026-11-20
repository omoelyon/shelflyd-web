'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { use } from 'react';
import { productsApi } from '@/lib/api/products';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { Button } from '@/components/ui/button';
import { formatStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BuildSetButton } from '@/components/features/cart-sets/set-builder-dialog';
import ProductGallery from '@/components/features/products/product-gallery';
import QuantityField from '@/components/ui/quantity-field';
import { marketplaceViewPath, useTrackProductView } from '@/lib/use-track-product-view';
import { productImages } from '@/lib/product-images';

interface Props {
  params: Promise<{ uuid: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { uuid } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const updateCart = useCartStore((s) => s.updateCart);
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', uuid],
    queryFn: () => productsApi.getByUuid(uuid),
  });

  // Count the visit once the product has actually loaded (an unknown product is not a visit).
  useTrackProductView(product ? marketplaceViewPath(uuid) : null);

  const addToCart = useMutation({
    mutationFn: () =>
      cartApi.add({
        productId: product!.id,
        unitId: Number(selectedUnitId),
        quantity,
        note: note.trim() || undefined,
      }),
    onSuccess: (cart) => {
      updateCart(cart);
      toast.success('Added to cart!', { action: { label: 'View Cart', onClick: () => router.push('/cart') } });
      setNote('');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to add to cart.')),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return <div className="text-center py-24 text-muted-foreground">Product not found.</div>;
  }

  const selectedPrice = product.prices?.find((p) => p.unit === Number(selectedUnitId));

  const handleAddToCart = () => {
    if (isAuthenticated) {
      addToCart.mutate();
      return;
    }
    if (!selectedPrice) return;
    addGuestItem(product.businessId, {
      productId: product.id,
      unitId: Number(selectedUnitId),
      quantity,
      name: product.name,
      type: product.type,
      image: product.image,
      unit: selectedPrice.unitName,
      unitPrice: selectedPrice.price,
      note: note.trim() || undefined,
    });
    toast.success('Added to cart!', { action: { label: 'View Cart', onClick: () => router.push('/cart') } });
    setNote('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
      {/* Photos (a photo that fails to load falls back to a neutral block inside the gallery) */}
      <ProductGallery images={productImages(product)} alt={product.name} className="md:self-start" />

      {/* Info */}
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{product.type}</Badge>
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
          {product.description && (
            <p className="text-muted-foreground mt-2">{product.description}</p>
          )}
        </div>

        {/* Pricing */}
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
          {/* Step with the buttons, or just type the amount. */}
          <QuantityField value={quantity} onChange={setQuantity} label="quantity" />
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

        {/* Add to cart */}
        <Button
          className="w-full bg-primary text-primary-foreground hover:opacity-90"
          size="lg"
          disabled={!selectedUnitId || (product.status !== 'IN_STOCK' && product.status !== 'LOW_STOCK') || addToCart.isPending}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {addToCart.isPending ? 'Adding...' : product.status === 'OUT_OF_STOCK' ? 'Sold out' : 'Add to Cart'}
        </Button>
        {(product.status === 'IN_STOCK' || product.status === 'LOW_STOCK') && product.prices?.length > 0 && (
          <div className="text-center">
            <BuildSetButton
              businessId={product.businessId}
              label="Add to a set"
              initialItem={{ productId: product.id, unitId: selectedUnitId ? Number(selectedUnitId) : product.prices[0].unit }}
            />
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
      </div>
    </div>
  );
}
