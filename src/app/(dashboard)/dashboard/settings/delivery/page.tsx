'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import type { DeliveryLocation } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  location: z.string().min(2, 'Location name is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
});
type FormValues = z.infer<typeof schema>;

export default function DeliveryLocationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryLocation | null>(null);
  const qc = useQueryClient();

  const { data: locations, isLoading } = useQuery({
    queryKey: ['delivery-locations'],
    queryFn: deliveryApi.list,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
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
        {isLoading ? (
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
