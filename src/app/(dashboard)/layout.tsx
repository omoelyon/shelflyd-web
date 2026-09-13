'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/layout/dashboard-sidebar';
import DashboardMobileNav from '@/components/layout/dashboard-mobile-nav';
import DashboardHeader from '@/components/layout/dashboard-header';
import { useMyBusiness } from '@/hooks/use-my-business';
import { Loader2 } from 'lucide-react';

const BARE_PATHS = ['/dashboard/login', '/dashboard/register-business'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasBusiness, isChecking } = useMyBusiness();

  const isBarePath = BARE_PATHS.includes(pathname);

  useEffect(() => {
    if (!isBarePath && !isChecking && !hasBusiness) {
      router.replace('/dashboard/register-business');
    }
  }, [isBarePath, isChecking, hasBusiness, router]);

  if (isBarePath) {
    return <>{children}</>;
  }

  // This is the business dashboard — a buyer with no business of their own
  // never sees this chrome, only their own /account area.
  if (isChecking || !hasBusiness) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-low">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-surface-low pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
