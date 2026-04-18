'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { deliveryApi } from '@/lib/api/delivery';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deliveryLocationSchema, type DeliveryLocationFormValues } from '@/lib/validations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { User, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

export default function AccountPage() {
  const [addingLocation, setAddingLocation] = useState(false);
  const qc = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
  });

  const { data: locations, isLoading: locLoading } = useQuery({
    queryKey: ['delivery-locations'],
    queryFn: deliveryApi.list,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeliveryLocationFormValues>({
    resolver: zodResolver(deliveryLocationSchema),
  });

  const addLocationMutation = useMutation({
    mutationFn: deliveryApi.create,
    onSuccess: () => {
      toast.success('Location added!');
      qc.invalidateQueries({ queryKey: ['delivery-locations'] });
      setAddingLocation(false);
      reset();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to add location.')),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">My Account</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          ) : user ? (
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28">Name:</span>
                <span className="font-medium">{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28">Phone:</span>
                <span className="font-medium">{user.phone}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Could not load profile.</p>
          )}
        </CardContent>
      </Card>

      {/* Delivery Locations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Saved Delivery Locations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingLocation(!addingLocation)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {addingLocation && (
            <form
              onSubmit={handleSubmit((d) => addLocationMutation.mutate(d as DeliveryLocationFormValues))}
              className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border"
            >
              <div className="space-y-1">
                <Label>Address</Label>
                <Input placeholder="12 Bode Thomas Street, Lagos" {...register('location')} />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Delivery fee (₦)</Label>
                <Input type="number" placeholder="1500" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={addLocationMutation.isPending}>
                  {addLocationMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingLocation(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {locLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : locations?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No saved locations.</p>
          ) : (
            <div className="space-y-2">
              {locations?.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">{loc.location}</p>
                    <p className="text-xs text-muted-foreground">Fee: ₦{loc.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
