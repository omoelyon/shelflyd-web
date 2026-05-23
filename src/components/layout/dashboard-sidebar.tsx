'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  Users,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const navItems = [
  { href: '/dashboard',           label: 'Overview',  icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products',  label: 'Products',  icon: Package },
  { href: '/dashboard/orders',    label: 'Orders',    icon: ShoppingBag },
  { href: '/dashboard/payments',  label: 'Payments',  icon: CreditCard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/team',      label: 'Team',      icon: Users },
  { href: '/dashboard/settings',  label: 'Settings',  icon: Settings },
];

export default function DashboardSidebar() {
  const pathname  = usePathname();
  const { user }  = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-[#091426] transition-all duration-300 ease-in-out shrink-0 relative',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#0058be]/10 blur-3xl" />
      </div>

      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center gap-2.5 shrink-0 overflow-hidden relative z-10',
        collapsed ? 'justify-center px-0' : 'px-4',
        'border-b border-white/[0.07]'
      )}>
        <div className="h-7 w-7 rounded-lg bg-[#0058be] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,88,190,0.4)]">
          <Store className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span
              className="font-extrabold text-white text-[15px] tracking-tight block leading-none"
              style={{ fontFamily: 'var(--font-manrope)' }}
            >
              Shelflyd
            </span>
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
              Dashboard
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-hidden relative z-10">
        {!collapsed && (
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.12em] px-3 pt-1 pb-2">
            Main Menu
          </p>
        )}
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 relative',
                collapsed ? 'justify-center h-9 w-9 mx-auto' : 'px-3 py-2',
                active
                  ? 'bg-[#0058be] text-white shadow-[0_0_16px_rgba(0,88,190,0.30)]'
                  : 'text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {!collapsed && (
        <div className="px-3 pb-3 relative z-10 border-t border-white/[0.07] pt-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.07] transition-colors cursor-default">
            <div className="h-7 w-7 rounded-full bg-[#0058be]/30 border border-[#0058be]/40 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-none">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading…'}
              </p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5 truncate">
                {user?.email ?? ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className={cn(
        'p-2 border-t border-white/[0.07] shrink-0 relative z-10',
        collapsed && 'flex justify-center'
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-600 hover:text-slate-300 hover:bg-white/[0.07] rounded-lg"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
