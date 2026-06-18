'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { businessesApi } from '@/lib/api/businesses';
import { registerBusinessSchema, type RegisterBusinessFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Store } from 'lucide-react';

export default function RegisterBusinessPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterBusinessFormValues>({
    resolver: zodResolver(registerBusinessSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: businessesApi.register,
    onSuccess: (business) => {
      qc.setQueryData(['business-profile'], business);
      qc.setQueryData(['business-settings'], business);
      toast.success('Business registered! Set up your brand.');
      router.push('/dashboard/settings');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to register business.')),
  });

  return (
    <div className="max-w-lg mx-auto py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Register Your Business</h1>
          <p className="text-sm text-muted-foreground">Start selling on Shelflyd</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>
            Your business will be reviewed by our team before going live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Business Name *</Label>
              <Input id="name" placeholder="Green Harvest Farms" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="slug">
                Storefront URL slug{' '}
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">shelflyd.com/</span>
                <Input
                  id="slug"
                  placeholder="my-farm"
                  {...register('slug')}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only. Leave blank to auto-generate.</p>
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers what your business is about..."
                rows={4}
                {...register('description')}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
              disabled={isPending}
            >
              {isPending ? 'Registering...' : 'Register Business'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
