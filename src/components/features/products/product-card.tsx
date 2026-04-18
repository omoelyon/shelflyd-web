import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

const statusColors: Record<Product['status'], string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  OUT_OF_STOCK: 'bg-red-100 text-red-700',
  DISCONTINUED: 'bg-gray-100 text-gray-700',
};

export default function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = product.prices?.reduce(
    (min, p) => (p.price < min.price ? p : min),
    product.prices[0]
  );

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col overflow-hidden">
        <div className="relative h-48 bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          <Badge
            className={`absolute top-2 right-2 text-xs ${statusColors[product.status]}`}
            variant="secondary"
          >
            {product.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold truncate">{product.name}</h3>
          {product.type && (
            <p className="text-xs text-muted-foreground mt-0.5">{product.type}</p>
          )}
          {product.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
          {lowestPrice ? (
            <p className="font-semibold text-primary">
              From {lowestPrice.currency} {lowestPrice.price.toLocaleString()}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">No price set</p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
