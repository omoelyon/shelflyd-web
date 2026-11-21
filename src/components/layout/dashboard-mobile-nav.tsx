'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  BarChart3,
  Paintbrush,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',           label: 'Home',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products',  label: 'Products', icon: Package },
  { href: '/dashboard/inventory', label: 'Stock',    icon: Boxes },
  { href: '/dashboard/orders',    label: 'Orders',   icon: ShoppingBag },
  { href: '/dashboard/analytics', label: 'Insights', icon: BarChart3 },
  // Finance has no tab here (it is linked from Insights); short labels so seven items still fit on a 360px screen; the page itself is titled "Storefront".
  { href: '/dashboard/storefront', label: 'Store',    icon: Paintbrush },
  { href: '/dashboard/settings',  label: 'Settings', icon: Settings },
];

export default function DashboardMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const activeIndex = navItems.findIndex((item) => isActive(item.href, item.exact));

  return (
    <nav aria-label="Dashboard" className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-0">
      <div
        className="glass rounded-2xl shadow-[0_-4px_24px_rgba(9,20,38,0.10)] border border-[rgba(9,20,38,0.06)] relative grid px-1 py-2"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {/* The dark pill glides to the active tab (it is exactly one column wide). */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-2 left-1 rounded-xl bg-[#091426] shadow-sm transition-transform duration-300 ease-(--ease-out)"
            style={{ width: `calc((100% - 0.5rem) / ${navItems.length})`, transform: `translateX(${activeIndex * 100}%)` }}
          />
        )}
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative z-10 flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-xl transition-colors duration-300 ease-(--ease-out) active:scale-95',
                active ? 'text-white' : 'text-[#64748b] hover:text-[#091426]'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform duration-300 ease-(--ease-spring)', active && '-translate-y-0.5 scale-110')} />
              <span className="max-w-full truncate text-[10px] font-semibold tracking-normal leading-none mt-0.5">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
