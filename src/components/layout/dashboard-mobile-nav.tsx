'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',           label: 'Home',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products',  label: 'Products', icon: Package },
  { href: '/dashboard/orders',    label: 'Orders',   icon: ShoppingBag },
  { href: '/dashboard/analytics', label: 'Insights', icon: BarChart3 },
  { href: '/dashboard/settings',  label: 'Settings', icon: Settings },
];

export default function DashboardMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-0">
      <div className="glass rounded-2xl shadow-[0_-4px_24px_rgba(9,20,38,0.10)] border border-[rgba(9,20,38,0.06)] flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                active
                  ? 'bg-[#091426] text-white'
                  : 'text-[#64748b] hover:text-[#091426] hover:bg-[#091426]/8'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className={cn(
                'text-[10px] font-semibold uppercase tracking-widest leading-none mt-0.5',
                active ? 'text-white' : 'text-[#64748b]'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
