import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import type { Product } from '@/types';
import { formatStatus } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const statusConfig: Record<Product['status'], { label: string; className: string }> = {
  IN_STOCK: { label: 'In Stock', className: 'bg-green-50 text-green-700' },
  LOW_STOCK: { label: 'Low Stock', className: 'bg-orange-50 text-orange-700' },
  OUT_OF_STOCK: { label: 'Out of Stock', className: 'bg-red-50 text-red-700' },
  COMING_SOON: { label: 'Coming Soon', className: 'bg-blue-50 text-blue-700' },
};

export default function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = product.prices?.reduce(
    (min, p) => (p.price < min.price ? p : min),
    product.prices[0]
  );
  const status = statusConfig[product.status] ?? { label: formatStatus(product.status), className: 'bg-gray-100 text-gray-500' };

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-card rounded-2xl border border-border h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-border/80">
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
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
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
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
