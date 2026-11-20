'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from 'lucide-react';
import { uploadsApi } from '@/lib/api/uploads';
import { MAX_PRODUCT_IMAGES } from '@/lib/product-images';
import { cn, getApiError } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** A photo that is still uploading: shown from a local preview until the real URL comes back. */
interface Pending {
  id: string;
  preview: string;
}

interface ProductImagesFieldProps {
  /** The photos that are saved/uploaded, in order, cover first. */
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  /** Called with true while any photo is uploading, so the form can hold its Save button. */
  onBusyChange?: (busy: boolean) => void;
}

let counter = 0;
const nextId = () => `pending-${Date.now()}-${counter++}`;

/**
 * The seller's photo manager for a product: up to five photos, the first being the cover. Photos are added by
 * picking or dropping files, reordered with the arrows or "Make cover", and removed with the X.
 * Only finished uploads are reported through `onChange`; uploading photos live inside this component.
 */
export default function ProductImagesField({ value, onChange, disabled = false, onBusyChange }: ProductImagesFieldProps) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [flashUrl, setFlashUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Uploads finish later, so they must add to the list as it is *then*, not as it was when they started.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Local preview URLs are released when their upload ends and when the field goes away.
  const previews = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const map = previews.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  const busy = pending.length > 0;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // A moved photo flashes briefly so the seller sees where it went.
  useEffect(() => {
    if (!flashUrl) return;
    const t = window.setTimeout(() => setFlashUrl(null), 1100);
    return () => window.clearTimeout(t);
  }, [flashUrl]);

  const total = value.length + pending.length;
  const room = MAX_PRODUCT_IMAGES - total;

  // Photos queued or uploading right now; a ref so the async loop below always sees the current number.
  const inFlight = useRef(0);

  const finishUpload = useCallback((id: string) => {
    const preview = previews.current.get(id);
    if (preview) URL.revokeObjectURL(preview);
    previews.current.delete(id);
    inFlight.current -= 1;
    setPending((p) => p.filter((x) => x.id !== id));
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (disabled || files.length === 0) return;
      const valid: File[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error('Choose a PNG, JPG, or WebP image.');
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error('That image is over 5 MB. Choose a smaller one.');
          continue;
        }
        valid.push(file);
      }
      const slots = Math.max(MAX_PRODUCT_IMAGES - (valueRef.current.length + inFlight.current), 0);
      if (valid.length > slots) {
        toast.error(`You can add ${MAX_PRODUCT_IMAGES} photos per product`);
      }
      const accepted = valid.slice(0, slots);
      if (accepted.length === 0) return;

      // Every accepted photo shows up at once, with its local preview; they then upload one at a time so the order is kept.
      const queued = accepted.map((file) => {
        const id = nextId();
        const preview = URL.createObjectURL(file);
        previews.current.set(id, preview);
        return { id, preview, file };
      });
      inFlight.current += queued.length;
      setPending((p) => [...p, ...queued.map(({ id, preview }) => ({ id, preview }))]);

      for (const { id, file } of queued) {
        try {
          const url = await uploadsApi.uploadFile(file);
          const current = valueRef.current;
          const next = current.includes(url) ? current : [...current, url].slice(0, MAX_PRODUCT_IMAGES);
          valueRef.current = next;
          onChangeRef.current(next);
        } catch (err) {
          toast.error(getApiError(err, "The photo didn't upload. Try again."));
        } finally {
          finishUpload(id);
        }
      }
    },
    [disabled, finishUpload],
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setFlashUrl(item);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload product photos"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          void addFiles(files);
        }}
      />

      <div
        onDragOver={(e) => {
          if (disabled || !isFiles(e)) return;
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragActive(false);
        }}
        onDrop={(e) => {
          if (disabled || !isFiles(e)) return;
          e.preventDefault();
          setDragActive(false);
          void addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          'grid grid-cols-2 gap-3 rounded-xl p-1 -m-1 transition-colors duration-200 sm:grid-cols-3',
          dragActive && 'bg-[#eff4ff] ring-2 ring-[#0058be]/40',
        )}
      >
        {value.map((url, index) => (
          <div
            key={url}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-xl border border-[rgba(9,20,38,0.1)] bg-[#f8f9ff]',
              flashUrl === url && 'sf-flash',
            )}
          >
            <Image src={url} alt={`Product photo ${index + 1}`} fill className="object-contain" unoptimized />

            {index === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-[#091426] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                Cover
              </span>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(index)}
              aria-label={`Remove photo ${index + 1}`}
              className="sf-press absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#091426] shadow-sm transition-colors hover:bg-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 pt-6">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={`Move photo ${index + 1} earlier`}
                  className="sf-press flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#091426] shadow-sm transition-opacity hover:bg-white disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`Move photo ${index + 1} later`}
                  className="sf-press flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#091426] shadow-sm transition-opacity hover:bg-white disabled:opacity-40"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {index > 0 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => move(index, 0)}
                  aria-label={`Make photo ${index + 1} the cover`}
                  title="Make cover"
                  className="sf-press flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#091426] shadow-sm transition-colors hover:bg-white disabled:opacity-50"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {pending.map((p) => (
          <div
            key={p.id}
            className="sf-rise relative aspect-square overflow-hidden rounded-xl border border-[rgba(9,20,38,0.1)] bg-[#f8f9ff]"
          >
            <Image src={p.preview} alt="Photo being uploaded" fill className="object-contain" unoptimized />
            <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-white/70 text-sm text-[#0058be]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading
            </div>
          </div>
        ))}

        {room > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'sf-press flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058be]/50 disabled:opacity-50',
              dragActive ? 'border-[#0058be] bg-[#eff4ff]' : 'border-[rgba(9,20,38,0.15)] hover:border-[#0058be]/50 hover:bg-[#f8f9ff]',
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff]">
              <ImagePlus className="h-5 w-5 text-[#0058be]" />
            </span>
            <span className="text-sm font-medium text-[#091426]">Add photo</span>
            <span className="text-[11px] leading-tight text-[#64748b]">
              {total === 0 ? 'Drag photos here or click to browse' : 'PNG, JPG or WebP, up to 5 MB'}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-[#64748b]">
          The first photo is the one shoppers see first. Add more angles, details or the product in use.
        </p>
        <p className="shrink-0 text-xs font-medium tabular-nums text-[#64748b]" aria-live="polite">
          {total} of {MAX_PRODUCT_IMAGES} photos
        </p>
      </div>
    </div>
  );
}
