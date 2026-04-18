'use client';

import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/clear-cookie', { method: 'POST' });
    logout();
    router.push('/');
  };

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <div>
        <h2 className="font-semibold text-foreground">Business Dashboard</h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Logout</span>
        </Button>
      </div>
    </header>
  );
}
