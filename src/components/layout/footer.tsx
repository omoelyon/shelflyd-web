import Link from 'next/link';
import { Store } from 'lucide-react';

const links = {
  marketplace: [
    { href: '/businesses', label: 'Businesses' },
    { href: '/products', label: 'Products' },
    { href: '/auth/register', label: 'Sell on Shelflyd' },
  ],
  account: [
    { href: '/auth/login', label: 'Sign In' },
    { href: '/account', label: 'My Account' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/invites', label: 'Team Invites' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#091426] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-lg text-white mb-4">
            <div className="h-7 w-7 rounded-lg bg-[#0058be] flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-manrope)' }}>Shelflyd</span>
          </Link>
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            The multi-tenant marketplace for African businesses. Launch your storefront, manage inventory, and grow your brand.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold text-sm mb-4 text-white/60 uppercase tracking-wider text-xs">Marketplace</h4>
          <ul className="space-y-2.5">
            {links.marketplace.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-4 text-white/60 uppercase tracking-wider text-xs">Account</h4>
          <ul className="space-y-2.5">
            {links.account.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8 px-4 py-4">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Shelflyd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
