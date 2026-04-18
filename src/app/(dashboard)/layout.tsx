import DashboardSidebar from '@/components/layout/dashboard-sidebar';
import DashboardMobileNav from '@/components/layout/dashboard-mobile-nav';
import DashboardHeader from '@/components/layout/dashboard-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
