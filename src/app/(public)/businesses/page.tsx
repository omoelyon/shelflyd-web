'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import BusinessCard from '@/components/features/business/business-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/ui/empty-state';
import { Search, Store } from 'lucide-react';

export default function BusinessesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.listAll,
  });

  const filtered = data?.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-1">Explore</p>
        <h1 className="text-3xl font-bold text-[#091426] font-heading mb-1">Browse Businesses</h1>
        <p className="text-[#64748b] text-sm">
          Discover active businesses on Shelflyd.
          {data && !isLoading && (
            <span className="ml-1 text-[#091426] font-medium">{data.length} available</span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
        <Input
          placeholder="Search by name or description…"
          className="pl-9 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <EmptyState
          icon={Store}
          title="Failed to load businesses"
          subtitle="Something went wrong. Please try again."
          action={{ label: 'Try Again', onClick: () => refetch() }}
        />
      )}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {filtered?.length === 0 ? (
            <EmptyState
              icon={Store}
              title={search ? `No results for "${search}"` : 'No businesses yet'}
              subtitle={search ? 'Try a different search term.' : 'Check back soon.'}
              action={search ? { label: 'Clear search', onClick: () => setSearch('') } : undefined}
            />
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
