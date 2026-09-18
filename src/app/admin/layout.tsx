'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Store, Building2, Package, ShieldCheck, LayoutDashboard, Users, ShoppingBag, Tag, CreditCard, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/admin',             label: 'Overview',   icon: LayoutDashboard },
  { href: '/admin/businesses',  label: 'Businesses', icon: Building2 },
  { href: '/admin/products',    label: 'Products',   icon: Package },
  { href: '/admin/orders',      label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/payments',    label: 'Payments',   icon: CreditCard },
  { href: '/admin/categories',  label: 'Categories', icon: Tag },
  { href: '/admin/users',       label: 'Users',      icon: Users },
];

function AdminSidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="h-full bg-[#091426] flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-white/8 gap-3 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-[#0058be] flex items-center justify-center shadow-md">
          <Store className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-[15px] leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>
            Shelflyd
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">Admin Console</p>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-[#0058be]/20 border border-[#0058be]/30 rounded-lg px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 text-[#60a5fa]" />
          <span className="text-xs font-semibold text-[#60a5fa]">Platform Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2">
          Management
        </p>
        {adminNav.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#0058be] text-white'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/8 shrink-0">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile nav sheet whenever the route changes
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Login page renders without the sidebar chrome
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9ff]">
      {/* Dark navy sidebar — desktop only */}
      <aside className="hidden md:flex md:w-60 shrink-0">
        <AdminSidebarContent pathname={pathname} />
      </aside>

      {/* Mobile off-canvas nav */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-72 p-0 border-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebarContent pathname={pathname} onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 md:px-6 shrink-0 shadow-[0_1px_3px_rgba(9,20,38,0.04)]">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden text-[#0b1c30] shrink-0"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-4.5 w-4.5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <h1 className={cn('text-sm font-semibold text-[#0b1c30] truncate')} style={{ fontFamily: 'var(--font-manrope)' }}>
              Admin Dashboard
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-[#64748b] hover:text-red-600 hover:bg-red-50 shrink-0"
          >
            <LogOut className="h-3.5 w-3.5 md:mr-1.5" />
            <span className="hidden md:inline">Sign out</span>
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
