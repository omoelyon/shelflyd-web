'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { updateSettingsSchema, type UpdateSettingsFormValues } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import type { Business } from '@/types';

interface Props {
  business: Business;
}

export default function BrandIdentityForm({ business }: Props) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateSettingsFormValues>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      name: business.name,
      description: business.description,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UpdateSettingsFormValues) =>
      settingsApi.updateSettings({ name: data.name, description: data.description }),
    onSuccess: (updated) => {
      qc.setQueryData(['business-settings'], updated);
      qc.setQueryData(['business-profile'], updated);
      toast.success('Settings saved!');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to save settings.')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Business Name</Label>
        <Input id="name" {...register('name')} placeholder="Green Harvest Farms" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Tell customers about your business..."
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || !isDirty}
        className="bg-primary text-primary-foreground hover:opacity-90"
      >
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
