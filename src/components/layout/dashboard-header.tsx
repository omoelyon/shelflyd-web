'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/products': 'Products',
  '/dashboard/orders': 'Orders',
  '/dashboard/payments': 'Payments',
  '/dashboard/team': 'Team',
  '/dashboard/settings': 'Settings',
  '/dashboard/register-business': 'Register Business',
};

export default function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    logout();
    router.push('/');
  };

  const pageTitle = pageTitles[pathname] ?? 'Dashboard';

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-[0_1px_3px_rgba(9,20,38,0.04)]">
      <div>
        <h1
          className="font-bold text-[#091426] text-[15px]"
          style={{ fontFamily: 'var(--font-manrope)' }}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2.5 pl-1 border-l border-[#e2e8f0] ml-1">
          <div className="h-7 w-7 rounded-full bg-[#091426] text-white text-xs font-semibold flex items-center justify-center">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium text-[#0b1c30]">
            {user ? `${user.firstName} ${user.lastName}` : 'Loading…'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-[#64748b] hover:text-red-600 hover:bg-red-50 h-8"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1.5 text-xs">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
