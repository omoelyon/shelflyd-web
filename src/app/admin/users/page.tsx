'use client';

import { useQuery } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api/users';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import { Users, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminUsersApi.list,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Users"
        subtitle={`${users?.length ?? 0} registered users`}
      />

      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
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
        ) : !users?.length ? (
          <EmptyState
            icon={Users}
            title="No users found"
            subtitle="Registered users will appear here."
          />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {users.map((user) => {
              const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8f9ff] transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-[#091426] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials || <UserCircle className="h-4 w-4" />}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#091426] truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-[#64748b] truncate sm:hidden">{user.email}</p>
                  </div>

                  {/* Email (desktop) */}
                  <p className="hidden sm:block text-sm text-[#64748b] flex-1 min-w-0 truncate">
                    {user.email}
                  </p>

                  {/* Joined date */}
                  <p className="text-xs text-[#94a3b8] shrink-0">
                    {user.createdAt
                      ? format(new Date(user.createdAt.replace(' ', 'T')), 'dd MMM yyyy')
                      : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
