'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import BusinessCard from '@/components/features/business/business-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Store, RefreshCw } from 'lucide-react';

export default function BusinessesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.listAll,
  });

  const filtered = data?.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary mb-1">Explore</p>
        <h1 className="text-3xl font-bold mb-2">Browse Businesses</h1>
        <p className="text-muted-foreground text-sm">
          Discover active businesses on Shelflyd.
          {data && !isLoading && (
            <span className="ml-1 text-foreground font-medium">{data.length} available</span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name or description…"
          className="pl-9 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-20">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4 font-medium">Failed to load businesses.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {filtered?.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No businesses found</p>
              <p className="text-sm text-muted-foreground">
                {search ? `No results for "${search}". Try a different search.` : 'No businesses available yet.'}
              </p>
              {search && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
