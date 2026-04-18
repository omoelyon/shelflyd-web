'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import BusinessCard from '@/components/features/business/business-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Store } from 'lucide-react';

export default function BusinessesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.listAll,
  });

  const filtered = data?.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Businesses</h1>
        <p className="text-muted-foreground">Discover active businesses on Shelflyd.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Failed to load businesses.</p>
          <button onClick={() => refetch()} className="text-primary underline">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {filtered?.length === 0 ? (
            <div className="text-center py-16">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No businesses match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered?.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
