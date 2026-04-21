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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-[#091426] transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-white/8 gap-2.5 shrink-0 overflow-hidden',
        collapsed ? 'justify-center px-0' : 'px-4'
      )}>
        <div className="h-7 w-7 rounded-lg bg-[#0058be] flex items-center justify-center shrink-0">
          <Store className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-[15px] truncate" style={{ fontFamily: 'var(--font-manrope)' }}>
            Shelflyd
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-hidden">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-1 pb-2">
            Menu
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
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center h-9 w-9 mx-auto' : 'px-3 py-2',
                active
                  ? 'bg-[#0058be] text-white'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className={cn('p-2 border-t border-white/8 shrink-0', collapsed && 'flex justify-center')}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/8"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
