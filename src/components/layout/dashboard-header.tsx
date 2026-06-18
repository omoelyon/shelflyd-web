'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, Search } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/products': 'Products',
  '/dashboard/orders': 'Orders',
  '/dashboard/payments': 'Payments',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/team': 'Team',
  '/dashboard/settings': 'Settings',
  '/dashboard/settings/delivery': 'Delivery Locations',
  '/dashboard/register-business': 'Register Business',
};

export default function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const { data: business } = useQuery({
    queryKey: ['my-business'],
    queryFn: businessesApi.getProfile,
    retry: false,
    staleTime: 60_000,
  });

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    logout();
    router.push('/');
  };

  const pageTitle = pageTitles[pathname] ?? 'Dashboard';
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';
  const roleLabel = business?.ownerId === user?.id ? 'Owner' : 'Team Member';

  return (
    <header className="sticky top-0 z-40 h-14 glass shadow-[0_1px_0_rgba(9,20,38,0.06)] flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left — page title */}
      <h1
        className="font-bold text-[#091426] text-[15px] tracking-tight"
        style={{ fontFamily: 'var(--font-manrope)' }}
      >
        {pageTitle}
      </h1>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        {/* Search (decorative — real search lives on pages) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#64748b] hover:text-[#091426] hover:bg-[#091426]/8 rounded-lg"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#64748b] hover:text-[#091426] hover:bg-[#091426]/8 rounded-lg"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="h-5 w-px bg-[rgba(9,20,38,0.10)] mx-1" />

        {/* User chip */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#091426] text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[#0b1c30] leading-none">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading…'}
            </p>
            <p className="text-[10px] text-[#64748b] leading-none mt-0.5 uppercase tracking-widest">
              {roleLabel}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-8 w-8 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-lg ml-0.5"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
