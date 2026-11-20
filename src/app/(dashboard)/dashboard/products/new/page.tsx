'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Store } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { quickProductSchema, type QuickProductFormValues } from '@/lib/validations';
import { getApiError } from '@/lib/utils';
import { useMyBusiness } from '@/hooks/use-my-business';
import PageHeader from '@/components/ui/page-header';
import ProductPreviewCard from '@/components/features/products/product-preview-card';
import ProductImagesField from '@/components/features/products/product-images-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { Product } from '@/types';

const UNIT_SUGGESTIONS = ['Piece', 'Kg', 'Bag', 'Carton', 'Litre', 'Pack', 'Dozen', 'Bunch'];

const defaultValues: Partial<QuickProductFormValues> = {
  name: '',
  description: '',
  images: [],
  unitName: '',
};

/** "1234567.5" -> "1,234,567.5", keeping a trailing dot while the seller is still typing. */
function formatPriceText(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  const decimals = rest.join('').slice(0, 2);
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cleaned.includes('.') ? `${grouped || '0'}.${decimals}` : grouped;
}

export default function NewProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { business } = useMyBusiness();

  const [published, setPublished] = useState<Product | null>(null);
  const [publishedHadStock, setPublishedHadStock] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);

  const [priceText, setPriceText] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<QuickProductFormValues>({
    resolver: zodResolver(quickProductSchema),
    mode: 'onChange',
    defaultValues,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const name = watch('name');
  const description = watch('description');
  const unitName = watch('unitName');
  const price = watch('price');
  const stock = watch('stock');
  const images = watch('images') ?? [];

  const publishMutation = useMutation({
    mutationFn: productsApi.createQuick,
    onSuccess: (product, variables) => {
      qc.invalidateQueries({ queryKey: ['business-products'] });
      qc.invalidateQueries({ queryKey: ['setup-status'] });
      toast.success('Product published');
      setPublishedHadStock(variables.stock !== undefined);
      setPublished(product);
    },
    onError: (error) => toast.error(getApiError(error, "We couldn't publish this product. Check the details and try again.")),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryName: string) => categoriesApi.createForBusiness({ name: categoryName }),
    onSuccess: (category) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setValue('category', category.id, { shouldValidate: true });
      toast.success(`Category "${category.name}" added`);
      setCategoryDialogOpen(false);
      setNewCategoryName('');
    },
    onError: (error) => toast.error(getApiError(error, "We couldn't add that category.")),
  });

  const startAnother = () => {
    reset(defaultValues);
    setPriceText('');
    setPublished(null);
  };

  const onSubmit = (values: QuickProductFormValues) => {
    publishMutation.mutate({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      category: values.category,
      images: values.images && values.images.length > 0 ? values.images : undefined,
      unitName: values.unitName.trim(),
      price: values.price,
      stock: values.stock,
    });
  };

  // ── Success state ───────────────────────────────────────────────────────────

  if (published) {
    return (
      <div className="max-w-xl mx-auto pt-6">
        <div className="bg-white rounded-2xl shadow-card-md p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#091426] font-heading">Product published</h1>
            <p className="text-sm text-[#64748b]">
              <span className="font-medium text-[#091426]">{published.name}</span> is live on your store.
            </p>
          </div>

          {!publishedHadStock && (
            <div className="flex gap-3 text-left rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                You didn&apos;t set a stock level, so customers can order any quantity. You can add stock
                any time from the product&apos;s Inventory button.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Button onClick={startAnother} className="bg-[#091426] text-white hover:bg-[#091426]/90">
              Add another product
            </Button>
            {business?.slug && (
              <Button variant="outline" onClick={() => router.push(`/storefront/${business.slug}`)}>
                <Store className="h-4 w-4 mr-2" />
                View in your store
              </Button>
            )}
          </div>
          <Link href="/dashboard/products" className="inline-block text-sm font-medium text-[#0058be] hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const selectedCategory = (value: number | undefined) =>
    value ? (categories?.find((c) => c.id === value)?.name ?? String(value)) : null;

  const unitDatalistId = 'unit-suggestions';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#091426] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Products
        </Link>
        <PageHeader
          title="Add a product"
          subtitle="Add a photo, a price, and how much you have. You can change anything later."
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          {/* ── Left: form cards ─────────────────────────────────────────────── */}
          <div className="space-y-6 min-w-0">
            <section className="bg-white rounded-2xl shadow-card-md p-5 sm:p-6 space-y-5" aria-labelledby="details-heading">
              <h2 id="details-heading" className="font-semibold text-[#091426] font-heading">
                Product details
              </h2>

              {/* Photos */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#091426]">Photos</Label>
                <ProductImagesField
                  value={images}
                  onChange={(urls) => setValue('images', urls, { shouldValidate: true })}
                  onBusyChange={setImageUploading}
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="product-name" className="text-sm font-medium text-[#091426]">
                  Product name
                </Label>
                <Input
                  id="product-name"
                  placeholder="Fresh tomatoes"
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-category" className="text-sm font-medium text-[#091426]">
                    Category <span className="font-normal text-[#64748b]">(optional)</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCategoryDialogOpen(true)}
                    className="text-xs font-medium text-[#0058be] hover:underline"
                  >
                    New category
                  </button>
                </div>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    >
                      <SelectTrigger id="product-category" className="w-full">
                        {selectedCategory(field.value) ?? <span className="text-muted-foreground">Choose a category</span>}
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.length ? (
                          categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No categories yet. Use &quot;New category&quot; to add one.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="product-description" className="text-sm font-medium text-[#091426]">
                  Description <span className="font-normal text-[#64748b]">(optional)</span>
                </Label>
                <Textarea
                  id="product-description"
                  rows={3}
                  placeholder="Where it's from, what's special, how it's packed"
                  aria-invalid={!!errors.description}
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-card-md p-5 sm:p-6 space-y-5" aria-labelledby="price-heading">
              <h2 id="price-heading" className="font-semibold text-[#091426] font-heading">
                Price and stock
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="product-price" className="text-sm font-medium text-[#091426]">
                    Price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b] pointer-events-none" aria-hidden="true">
                      ₦
                    </span>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="product-price"
                          inputMode="decimal"
                          placeholder="0"
                          className="pl-7"
                          autoComplete="off"
                          aria-invalid={!!errors.price}
                          value={priceText}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const text = formatPriceText(e.target.value);
                            setPriceText(text);
                            const parsed = parseFloat(text.replace(/,/g, ''));
                            field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                          }}
                        />
                      )}
                    />
                  </div>
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <Label htmlFor="product-stock" className="text-sm font-medium text-[#091426]">
                    In stock <span className="font-normal text-[#64748b]">(optional)</span>
                  </Label>
                  <Input
                    id="product-stock"
                    inputMode="numeric"
                    placeholder="20"
                    autoComplete="off"
                    aria-invalid={!!errors.stock}
                    {...register('stock', {
                      setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(String(v).replace(/,/g, ''))),
                    })}
                  />
                  {errors.stock ? (
                    <p className="text-xs text-destructive">{errors.stock.message}</p>
                  ) : (
                    <p className="text-xs text-[#64748b]">Leave blank if you don&apos;t track stock.</p>
                  )}
                </div>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="product-unit" className="text-sm font-medium text-[#091426]">
                  Sold per
                </Label>
                <Input
                  id="product-unit"
                  list={unitDatalistId}
                  placeholder="Bag, Kg, Piece"
                  autoComplete="off"
                  aria-invalid={!!errors.unitName}
                  {...register('unitName')}
                />
                <datalist id={unitDatalistId}>
                  {UNIT_SUGGESTIONS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common units">
                  {UNIT_SUGGESTIONS.map((u) => {
                    const active = unitName?.trim().toLowerCase() === u.toLowerCase();
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setValue('unitName', u, { shouldValidate: true, shouldDirty: true })}
                        aria-pressed={active}
                        className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-[#091426] text-white border-[#091426]'
                            : 'bg-white text-[#475569] border-[rgba(9,20,38,0.15)] hover:bg-[#f8f9ff]'
                        }`}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
                {errors.unitName && <p className="text-xs text-destructive">{errors.unitName.message}</p>}
              </div>
            </section>

            {/* Action bar: the dashboard layout already pads the bottom for the mobile tab bar, so bottom-0 sits just above it */}
            <div className="sticky bottom-0 md:bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur border border-[rgba(9,20,38,0.08)] shadow-card-md px-4 py-3">
              <Button type="button" variant="ghost" onClick={() => router.push('/dashboard/products')}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0058be] text-white hover:bg-[#0058be]/90 min-w-36"
                disabled={!isValid || publishMutation.isPending || imageUploading}
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing
                  </>
                ) : imageUploading ? (
                  'Uploading photos'
                ) : (
                  'Publish product'
                )}
              </Button>
            </div>
          </div>

          {/* ── Right: live preview ──────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-6 space-y-3" aria-label="Preview">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-[0.1em]">How it looks in your store</p>
            <ProductPreviewCard
              name={name ?? ''}
              description={description}
              imageUrl={images[0] ?? null}
              extraPhotos={Math.max(images.length - 1, 0)}
              price={typeof price === 'number' ? price : undefined}
              unitName={unitName}
              stock={typeof stock === 'number' && !Number.isNaN(stock) ? stock : undefined}
            />
          </aside>
        </div>
      </form>

      {/* ── New category ─────────────────────────────────────────────────────── */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) setNewCategoryName('');
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newCategoryName.trim()) createCategoryMutation.mutate(newCategoryName.trim());
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-category-name" className="text-sm font-medium text-[#091426]">
                Category name
              </Label>
              <Input
                id="new-category-name"
                placeholder="Grains and legumes"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? 'Adding' : 'Add category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
