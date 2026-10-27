import Image from 'next/image';
import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductPreviewCardProps {
  name: string;
  description?: string;
  imageUrl?: string | null;
  price?: number;
  unitName?: string;
  /** Units in stock, if the seller tracks it. 0 shows as out of stock. */
  stock?: number;
}

/**
 * What a product will look like on the storefront, updated as the seller fills in the form.
 * Mirrors the real ProductCard layout without being a link.
 */
export default function ProductPreviewCard({
  name,
  description,
  imageUrl,
  price,
  unitName,
  stock,
}: ProductPreviewCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!imageUrl && failedUrl !== imageUrl;
  const outOfStock = stock !== undefined && stock <= 0;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
      <div className="relative h-44 bg-muted overflow-hidden">
        {showImage ? (
          <Image
            src={imageUrl!}
            alt=""
            fill
            className="object-cover"
            unoptimized
            onError={() => setFailedUrl(imageUrl!)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <Package className="h-8 w-8" />
            <span className="text-xs">Your photo appears here</span>
          </div>
        )}
        <span
          className={`absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
            outOfStock ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {outOfStock ? 'Out of stock' : 'In stock'}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className={`font-semibold text-sm truncate ${name ? 'text-foreground' : 'text-muted-foreground/60'}`}>
          {name || 'Product name'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed min-h-8">
          {description || 'A short description helps customers decide.'}
        </p>
        <div className="mt-3 pt-3 border-t border-border/60">
          {price ? (
            <p className="font-semibold text-sm text-primary">
              ₦{price.toLocaleString()}
              {unitName ? <span className="font-normal text-muted-foreground"> / {unitName}</span> : null}
            </p>
          ) : (
            <p className="text-muted-foreground/60 text-xs">Price appears here</p>
          )}
          {stock !== undefined && !outOfStock && (
            <p className="text-xs text-muted-foreground mt-0.5">{stock.toLocaleString()} in stock</p>
          )}
        </div>
      </div>
    </div>
  );
}
