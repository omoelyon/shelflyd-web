'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Store, LogOut, ChevronDown, Menu, LayoutDashboard, UserCircle, Mail } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/businesses', label: 'Businesses' },
  { href: '/products', label: 'Products' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const serverTotalItems = useCartStore((s) => s.getTotalItems());
  const guestTotalItems = useGuestCartStore((s) => s.getTotalItems());
  const totalItems = isAuthenticated ? serverTotalItems : guestTotalItems;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    logout();
    router.push('/');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-50 glass shadow-[0_1px_0_rgba(9,20,38,0.06)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[#091426] flex items-center justify-center shadow-md">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="text-[#091426] tracking-tight">Shelflyd</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-[#091426] bg-[#091426]/8'
                  : 'text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]'
              )}
            >
              {link.label}
              {pathname.startsWith(link.href) && (
                <span className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-[#0058be] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]">
              <ShoppingCart className="h-4.5 w-4.5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#0058be] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'flex items-center gap-2 h-9 px-2.5 text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]'
                )}
              >
                <div className="h-7 w-7 rounded-full bg-[#091426] text-white text-xs font-semibold flex items-center justify-center">
                  {initials || <UserCircle className="h-4 w-4" />}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-[#0b1c30]">
                  {user?.firstName ?? 'Account'}
                </span>
                <ChevronDown className="h-3 w-3 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-sm font-semibold text-[#0b1c30]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/account')}>
                  <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2 text-muted-foreground" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/invites')}>
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  Invites
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]"
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="bg-[#091426] text-white hover:bg-[#091426]/90 shadow-sm"
                onClick={() => router.push('/auth/register')}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'md:hidden h-9 w-9 text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]'
              )}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 bg-[#091426] border-l-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2.5 p-4 border-b border-white/8">
                  <div className="h-7 w-7 rounded-lg bg-[#0058be] flex items-center justify-center">
                    <Store className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-[15px]">Shelflyd</span>
                </div>
                <nav className="flex flex-col gap-1 p-3 flex-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        pathname.startsWith(link.href)
                          ? 'bg-[#0058be] text-white'
                          : 'text-slate-400 hover:bg-white/8 hover:text-white'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!isAuthenticated && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/8">
                      <Button
                        variant="outline"
                        className="w-full border-white/20 text-white bg-transparent hover:bg-white/8"
                        onClick={() => { router.push('/auth/login'); setMobileOpen(false); }}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="w-full bg-[#0058be] text-white hover:bg-[#0058be]/90"
                        onClick={() => { router.push('/auth/register'); setMobileOpen(false); }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </nav>
                {isAuthenticated && (
                  <div className="p-3 border-t border-white/8">
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-sm text-red-400 hover:bg-white/8 hover:text-red-300 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
