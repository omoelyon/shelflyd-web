import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import BusinessAvatar from '@/components/layout/business-avatar';
import type { Business } from '@/types';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link href={`/businesses/${business.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5 flex gap-4 items-start">
          <BusinessAvatar business={business} size={56} className="rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold truncate">{business.name}</h3>
              <Badge
                variant="secondary"
                className={
                  business.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : business.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {business.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {business.description || 'No description provided.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
