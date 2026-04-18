'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Upload, Sparkles, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { Business } from '@/types';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;

function buildFallbackUrl(name: string, themeColor: string | null): string {
  const color = (themeColor ?? '#16a34a').replace('#', '');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=256&bold=true&format=png`;
}

interface Props {
  business: Business;
}

export default function LogoUploader({ business }: Props) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(
    business.logo ?? buildFallbackUrl(business.name, business.themeColor)
  );
  const [fileError, setFileError] = useState<string | null>(null);

  const fallback = buildFallbackUrl(business.name, business.themeColor);

  const generateMutation = useMutation({
    mutationFn: settingsApi.generateLogo,
    onSuccess: (updated) => {
      qc.setQueryData(['business-settings'], updated);
      setLogoSrc(updated.logo ?? fallback);
      toast.success('Logo generated!');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to generate logo.')),
  });

  const removeMutation = useMutation({
    mutationFn: settingsApi.removeLogo,
    onSuccess: (updated) => {
      qc.setQueryData(['business-settings'], updated);
      setLogoSrc(fallback);
      toast.success('Logo removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove logo.')),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only PNG, JPG, GIF, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 20, 80));
    }, 200);

    try {
      const updated = await settingsApi.uploadLogo(file);
      clearInterval(interval);
      setUploadProgress(100);
      qc.setQueryData(['business-settings'], updated);
      setLogoSrc(updated.logo ?? fallback);
      toast.success('Logo uploaded!');
    } catch {
      clearInterval(interval);
      toast.error('Upload failed. Check file and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex items-center gap-6">
        <div className="relative h-28 w-28 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
          <Image
            src={logoSrc}
            alt={business.name}
            fill
            className="object-cover transition-opacity duration-300"
            onError={() => setLogoSrc(fallback)}
            unoptimized
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-16">
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Business Logo</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP · Max 5 MB</p>
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          onClick={() => fileInput.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Logo'}
        </Button>

        <Button
          variant="outline"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || isUploading}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generateMutation.isPending ? 'Generating...' : 'Generate Logo'}
        </Button>

        {business.logo && (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
