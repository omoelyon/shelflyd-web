import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Package } from 'lucide-react';
import type { Product } from '@/types';
import { cn, formatStatus } from '@/lib/utils';
import { productImages } from '@/lib/product-images';

interface ProductCardProps {
  product: Product;
  /** Where the card links. Defaults to the marketplace product page; storefronts pass their own themed page. */
  href?: string;
  /** Lets a host (the storefront editor preview) stop the link from navigating. */
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Extra classes / inline style for the link, so a host can add an entrance animation. */
  className?: string;
  style?: React.CSSProperties;
}

const statusConfig: Record<Product['status'], { label: string; className: string }> = {
  IN_STOCK: { label: 'In Stock', className: 'bg-green-50 text-green-700' },
  LOW_STOCK: { label: 'Low Stock', className: 'bg-orange-50 text-orange-700' },
  OUT_OF_STOCK: { label: 'Sold out', className: 'bg-red-50 text-red-700' },
  COMING_SOON: { label: 'Coming Soon', className: 'bg-blue-50 text-blue-700' },
};

export default function ProductCard({ product, href, onLinkClick, className, style }: ProductCardProps) {
  // SHF-16: a product's image field being non-empty doesn't mean the URL actually
  // resolves (a dead/placeholder host, for one real example) — fall back to the same
  // "No image" state on load failure instead of a broken-image icon.
  const [imageFailed, setImageFailed] = useState(false);
  // With two or more photos, the second fades in over the cover on hover (never on touch screens) or keyboard focus.
  const second = productImages(product)[1];
  const [secondFailed, setSecondFailed] = useState(false);
  const soldOut = product.status === 'OUT_OF_STOCK';
  const lowestPrice = product.prices?.reduce(
    (min, p) => (p.price < min.price ? p : min),
    product.prices[0]
  );
  const status = statusConfig[product.status] ?? { label: formatStatus(product.status), className: 'bg-gray-100 text-gray-500' };

  return (
    <Link href={href ?? `/products/${product.uuid}`} onClick={onLinkClick} className={cn('block group', className)} style={style}>
      <div className="sf-lift bg-card rounded-2xl border border-border h-full flex flex-col overflow-hidden">
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {product.image && !imageFailed ? (
            // Sold-out photos are dimmed together, so the hover photo is dimmed the same way as the cover.
            <div className={cn('absolute inset-0', soldOut && 'opacity-50 grayscale')}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="sf-img-in object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                unoptimized
                onError={() => setImageFailed(true)}
              />
              {second && !secondFailed && (
                <Image
                  src={second}
                  alt=""
                  aria-hidden="true"
                  fill
                  unoptimized
                  loading="lazy"
                  onError={() => setSecondFailed(true)}
                  className="object-cover opacity-0 transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:scale-105"
                />
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
              <Package className="h-8 w-8" />
              <span className="text-xs">No image</span>
            </div>
          )}
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          {product.type && (
            <p className="text-xs text-muted-foreground mt-0.5">{product.type}</p>
          )}
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed flex-1">
              {product.description}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-border/60">
            {lowestPrice ? (
              <p className="font-semibold text-sm text-primary">
                From {lowestPrice.currency} {lowestPrice.price.toLocaleString()}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">No price set</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
