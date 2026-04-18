'use client';

import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import BusinessCard from './business-card';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedBusinessesProps {
  limit?: number;
}

export default function FeaturedBusinesses({ limit }: FeaturedBusinessesProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.listAll,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit ?? 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-muted-foreground text-center py-8">Failed to load businesses.</p>;
  }

  const businesses = limit ? data?.slice(0, limit) : data;

  if (!businesses?.length) {
    return <p className="text-muted-foreground text-center py-8">No businesses found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}
