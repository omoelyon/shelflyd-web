'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { useThemeStore } from '@/stores/theme.store';
import { themeColorSchema, type ThemeColorFormValues } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn, getApiError } from '@/lib/utils';
import type { Business } from '@/types';

const PRESET_COLORS = [
  { hex: '#16a34a', name: 'Green' },
  { hex: '#2563eb', name: 'Blue' },
  { hex: '#7c3aed', name: 'Violet' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#d97706', name: 'Amber' },
  { hex: '#0891b2', name: 'Cyan' },
  { hex: '#db2777', name: 'Pink' },
];

interface Props {
  business: Business;
}

export default function ThemeColorPicker({ business }: Props) {
  const qc = useQueryClient();
  const { setPrimaryColor } = useThemeStore();
  const [previewColor, setPreviewColor] = useState<string>(
    business.themeColor ?? '#16a34a'
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ThemeColorFormValues>({
    resolver: zodResolver(themeColorSchema),
    defaultValues: { themeColor: business.themeColor ?? '#16a34a' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ThemeColorFormValues) =>
      settingsApi.updateSettings({ themeColor: data.themeColor }),
    onSuccess: (updated) => {
      qc.setQueryData(['business-settings'], updated);
      qc.setQueryData(['business-profile'], updated);
      setPrimaryColor(updated.themeColor ?? '#16a34a');
      toast.success('Brand color saved!');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to save color.')),
  });

  const handleSelectColor = (hex: string) => {
    setPreviewColor(hex);
    setValue('themeColor', hex, { shouldValidate: true });
    setPrimaryColor(hex); // live preview
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setPreviewColor(val);
      setPrimaryColor(val);
    }
  };

  return (
    <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-6">
      {/* Preset swatches */}
      <div>
        <Label className="mb-3 block">Preset Colors</Label>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map(({ hex, name }) => (
            <button
              key={hex}
              type="button"
              title={name}
              onClick={() => handleSelectColor(hex)}
              className={cn(
                'h-10 w-10 rounded-lg border-2 transition-all',
                previewColor === hex
                  ? 'border-foreground scale-110 shadow-md'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: hex }}
              aria-label={name}
            />
          ))}
        </div>
      </div>

      {/* Custom hex input */}
      <div className="space-y-1">
        <Label>Custom Hex Color</Label>
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg border border-border shrink-0"
            style={{ backgroundColor: previewColor }}
          />
          <Input
            {...register('themeColor')}
            placeholder="#16a34a"
            className="max-w-36 font-mono"
            onChange={(e) => {
              register('themeColor').onChange(e);
              handleCustomInput(e);
            }}
          />
        </div>
        {errors.themeColor && (
          <p className="text-xs text-destructive">{errors.themeColor.message}</p>
        )}
      </div>

      {/* Live preview card */}
      <div>
        <Label className="mb-3 block">Preview</Label>
        <div
          className="rounded-xl p-5 flex items-center gap-4"
          style={{ backgroundColor: `${previewColor}20` }}
        >
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: previewColor }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{business.name}</p>
            <p className="text-sm text-muted-foreground">
              {business.description || 'Your business description'}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-2 text-white"
              style={{ backgroundColor: previewColor }}
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="text-white"
        style={{ backgroundColor: previewColor }}
      >
        {isPending ? 'Saving...' : 'Save Color'}
      </Button>
    </form>
  );
}
