import Link from 'next/link';
import BusinessAvatar from '@/components/layout/business-avatar';
import type { Business } from '@/types';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link href={`/businesses/${business.uuid}`} className="block group">
      <div className="bg-card rounded-2xl border border-border p-5 flex gap-4 items-start h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-border/80">
        <BusinessAvatar
          business={business}
          size={52}
          className="rounded-xl shrink-0 ring-2 ring-border group-hover:ring-primary/20 transition-all"
        />
        <div className="flex-1 min-w-0">
          {/* Shoppers only ever see open stores, so no status badge here. */}
          <h3 className="mb-1.5 font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {business.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {business.description || 'Visit the store to see what they sell.'}
          </p>
        </div>
      </div>
    </Link>
  );
}
