import Link from 'next/link';
import BusinessAvatar from '@/components/layout/business-avatar';
import type { Business } from '@/types';
import { formatStatus } from '@/lib/utils';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link href={`/businesses/${business.id}`} className="block group">
      <div className="bg-card rounded-2xl border border-border p-5 flex gap-4 items-start h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-border/80">
        <BusinessAvatar
          business={business}
          size={52}
          className="rounded-xl shrink-0 ring-2 ring-border group-hover:ring-primary/20 transition-all"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                business.status === 'ACTIVE'
                  ? 'bg-green-50 text-green-700'
                  : business.status === 'PENDING'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {formatStatus(business.status)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {business.description || 'No description provided.'}
          </p>
        </div>
      </div>
    </Link>
  );
}
