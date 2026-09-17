'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';
import { businessesApi } from '@/lib/api/businesses';
import { settingsApi } from '@/lib/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Plus, MapPin, Pencil, Trash2, Truck, CheckCircle2 } from 'lucide-react';
import type { DeliveryAddress, DeliveryLocation } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  location: z.string().min(2, 'Location name is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
});
type FormValues = z.infer<typeof schema>;

const pickupAddressSchema = z.object({
  name: z.string().min(2, 'Business contact name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  addressLine: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
});
type PickupAddressValues = z.infer<typeof pickupAddressSchema>;

export default function DeliveryLocationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryLocation | null>(null);
  const qc = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business-profile'],
    queryFn: businessesApi.getProfile,
  });

  const { data: locations, isLoading } = useQuery({
    queryKey: ['delivery-locations', business?.id],
    queryFn: () => deliveryApi.listByBusiness(business!.id),
    enabled: !!business,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const {
    register: registerPickup,
    handleSubmit: handlePickupSubmit,
    reset: resetPickup,
    formState: { errors: pickupErrors },
  } = useForm<PickupAddressValues>({ resolver: zodResolver(pickupAddressSchema) });

  useEffect(() => {
    if (business) {
      resetPickup({
        name: business.name,
        phone: business.pickupPhone ?? '',
        addressLine: business.pickupAddressLine ?? '',
        city: business.pickupCity ?? '',
        state: business.pickupState ?? '',
      });
    }
  }, [business, resetPickup]);

  const pickupAddressMutation = useMutation({
    mutationFn: (values: DeliveryAddress) => settingsApi.setPickupAddress(values),
    onSuccess: () => {
      toast.success('Pickup address saved — courier delivery is ready.');
      qc.invalidateQueries({ queryKey: ['business-profile'] });
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to save pickup address.')),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ location: '', amount: 0 });
    setDialogOpen(true);
  };

  const openEdit = (loc: DeliveryLocation) => {
    setEditing(loc);
    setValue('location', loc.location);
    setValue('amount', loc.amount);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing
        ? deliveryApi.update(editing.id, values)
        : deliveryApi.create(values),
    onSuccess: () => {
      toast.success(editing ? 'Location updated!' : 'Location added!');
      qc.invalidateQueries({ queryKey: ['delivery-locations'] });
      setDialogOpen(false);
      setEditing(null);
      reset();
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to save location.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deliveryApi.delete(id),
    onSuccess: () => {
      toast.success('Location removed.');
      qc.invalidateQueries({ queryKey: ['delivery-locations'] });
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to delete location.')),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Courier Pickup Address
            {business?.pickupAddressCode && (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs font-medium ml-1">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Courier delivery enabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#64748b] mb-4">
            Set the address couriers will collect orders from. Required once before customers
            can choose real courier delivery at checkout, alongside your flat-rate zones below.
          </p>
          <form onSubmit={handlePickupSubmit((v) => pickupAddressMutation.mutate(v))} className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm font-medium text-[#091426]">Contact name</Label>
              <Input placeholder="e.g. Beans Bazaar" {...registerPickup('name')} />
              {pickupErrors.name && <p className="text-xs text-destructive">{pickupErrors.name.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm font-medium text-[#091426]">Phone number</Label>
              <Input placeholder="080..." {...registerPickup('phone')} />
              {pickupErrors.phone && <p className="text-xs text-destructive">{pickupErrors.phone.message}</p>}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm font-medium text-[#091426]">Street address</Label>
              <Input placeholder="12 Allen Avenue" {...registerPickup('addressLine')} />
              {pickupErrors.addressLine && <p className="text-xs text-destructive">{pickupErrors.addressLine.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">City</Label>
              <Input placeholder="Ikeja" {...registerPickup('city')} />
              {pickupErrors.city && <p className="text-xs text-destructive">{pickupErrors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">State</Label>
              <Input placeholder="Lagos" {...registerPickup('state')} />
              {pickupErrors.state && <p className="text-xs text-destructive">{pickupErrors.state.message}</p>}
            </div>
            <div className="col-span-2">
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={pickupAddressMutation.isPending}
              >
                {pickupAddressMutation.isPending ? 'Saving…' : 'Save Pickup Address'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <PageHeader
        title="Delivery Locations"
        subtitle="Configure zones where your business delivers and the applicable fees."
        action={
          <Button
            onClick={openCreate}
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        {isLoading || !business ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : !locations?.length ? (
          <EmptyState
            icon={MapPin}
            title="No delivery locations yet"
            subtitle="Add the areas you deliver to and the fees charged for each."
            action={{ label: 'Add Location', onClick: openCreate }}
          />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f9ff] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#eff4ff] flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-[#0058be]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#091426]">{loc.location}</p>
                    <p className="text-xs text-[#64748b]">₦{loc.amount.toLocaleString()} delivery fee</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]"
                    onClick={() => openEdit(loc)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#94a3b8] hover:text-red-500 hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(loc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); reset(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Location' : 'Add Delivery Location'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Location Name *</Label>
              <Input placeholder="e.g. Lagos Island" {...register('location')} />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Delivery Fee (₦) *</Label>
              <Input
                type="number"
                min="0"
                step="50"
                placeholder="e.g. 1500"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Add Location'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
