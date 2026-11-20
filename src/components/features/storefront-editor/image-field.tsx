'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadsApi } from '@/lib/api/uploads';
import { getApiError } from '@/lib/utils';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Shown while there is no image yet (e.g. what happens without one). */
  emptyHint?: string;
}

/** Upload (or remove) one image. Stores the public URL the upload service returns. */
export default function ImageField({ label, value, onChange, emptyHint }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // picking the same file again should still fire
    if (!file) return;
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Use a PNG, JPG, GIF or WebP image.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`The image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadsApi.uploadFile(file));
    } catch (err) {
      const message = getApiError(err, 'Could not upload the image. Try again.');
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {value && (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border bg-muted">
          <Image src={value} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={input} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" aria-label={`${label}: choose an image`} onChange={pick} />
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => input.current?.click()}>
          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading ? 'Uploading…' : value ? 'Change image' : 'Upload image'}
        </Button>
        {value && !uploading && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            <Trash2 />
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {!value && emptyHint && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
    </div>
  );
}
