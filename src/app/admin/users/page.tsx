'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api/users';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import PaginationControls from '@/components/ui/pagination-controls';
import { Input } from '@/components/ui/input';
import { Search, Users, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Search once typing pauses, from the first page.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', page, query],
    queryFn: () => adminUsersApi.list(page, PAGE_SIZE, query),
    placeholderData: keepPreviousData,
  });
  const users = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Users"
        subtitle={data ? `${total.toLocaleString('en-NG')} ${query ? 'matching' : 'registered'} ${total === 1 ? 'user' : 'users'}` : 'Registered users'}
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" aria-hidden="true" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or phone"
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      <div className={'bg-white rounded-2xl shadow-card-md overflow-hidden transition-opacity ' + (isFetching && !isLoading ? 'opacity-70' : '')}>
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#f1f5f9]">
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">User</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Email</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Joined</p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query ? 'No users match' : 'No users found'}
            subtitle={query ? 'Try a different name, email or phone number.' : 'Registered users will appear here.'}
          />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {users.map((user) => {
              const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
              return (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8f9ff] transition-colors">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-[#091426] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials || <UserCircle className="h-4 w-4" />}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#091426] truncate">
                      {user.firstName} {user.lastName}
                      {user.admin && <span className="ml-2 rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#0058be]">Staff</span>}
                    </p>
                    <p className="text-xs text-[#64748b] truncate sm:hidden">{user.email}</p>
                  </div>

                  {/* Email (desktop) */}
                  <p className="hidden sm:block text-sm text-[#64748b] flex-1 min-w-0 truncate">{user.email}</p>

                  {/* Joined date */}
                  <p className="text-xs text-[#94a3b8] shrink-0">{user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '—'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(data?.totalPages ?? 0) > 1 && (
        <PaginationControls
          page={page}
          totalPages={data?.totalPages ?? 1}
          isFirst={page === 0}
          isLast={page + 1 >= (data?.totalPages ?? 1)}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
