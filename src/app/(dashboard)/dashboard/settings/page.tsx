'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { useThemeStore } from '@/stores/theme.store';
import BrandIdentityForm from '@/components/features/settings/brand-identity-form';
import LogoUploader from '@/components/features/settings/logo-uploader';
import ThemeColorPicker from '@/components/features/settings/theme-color-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Store, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const loadFromBusiness = useThemeStore((s) => s.loadFromBusiness);
  const qc = useQueryClient();

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ['business-settings'],
    queryFn: settingsApi.getSettings,
  });

  useEffect(() => {
    if (business) loadFromBusiness(business);
  }, [business, loadFromBusiness]);

  // Auto-generate logo if missing
  const generateLogo = useMutation({
    mutationFn: settingsApi.generateLogo,
    onSuccess: (updated) => {
      qc.setQueryData(['business-settings'], updated);
      toast.success('Logo generated!');
    },
  });

  useEffect(() => {
    if (business && business.logo === null && !generateLogo.isPending && !generateLogo.isSuccess) {
      generateLogo.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, business?.logo]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="text-center py-24 space-y-4">
        <Store className="h-14 w-14 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">No business found. Register one first.</p>
        <Link href="/dashboard" className={cn(buttonVariants(), 'bg-primary text-primary-foreground')}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your brand identity, logo, and theme color.
        </p>
      </div>

      {/* Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Identity</CardTitle>
          <CardDescription>Update your business name and description.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandIdentityForm business={business} />
        </CardContent>
      </Card>

      <Separator />

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Upload, generate, or remove your business logo.</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUploader business={business} />
        </CardContent>
      </Card>

      <Separator />

      {/* Theme Color */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Color</CardTitle>
          <CardDescription>
            Choose a primary color for your storefront and dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeColorPicker business={business} />
        </CardContent>
      </Card>

      <Separator />

      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Zones</CardTitle>
          <CardDescription>
            Manage the areas you deliver to and the fees you charge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/settings/delivery"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#091426] text-white text-sm font-medium hover:bg-[#091426]/90 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Manage Delivery Locations
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
