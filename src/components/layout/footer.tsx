import Link from 'next/link';
import { Store } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg text-primary mb-2">
            <Store className="h-5 w-5" />
            Shelflyd
          </div>
          <p className="text-sm text-muted-foreground">
            The multi-tenant marketplace for African businesses.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Marketplace</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/businesses" className="hover:text-primary">Businesses</Link></li>
            <li><Link href="/products" className="hover:text-primary">Products</Link></li>
            <li><Link href="/auth/register" className="hover:text-primary">Sell on Shelflyd</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/auth/login" className="hover:text-primary">Login</Link></li>
            <li><Link href="/account" className="hover:text-primary">My Account</Link></li>
            <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Shelflyd. All rights reserved.
      </div>
    </footer>
  );
}
