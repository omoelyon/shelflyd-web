import Link from 'next/link';
import { Store, Building2, Package, ShieldCheck } from 'lucide-react';

const adminNav = [
  { href: '/admin', label: 'Overview', icon: ShieldCheck },
  { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/admin/products', label: 'Products', icon: Package },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border bg-white flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-border gap-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-primary">Admin Panel</span>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-muted/30 p-6 overflow-auto">{children}</main>
    </div>
  );
}
