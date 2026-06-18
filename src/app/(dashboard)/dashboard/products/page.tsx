'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { productsApi } from '@/lib/api/products';
import { pricingApi } from '@/lib/api/pricing';
import { inventoryApi } from '@/lib/api/inventory';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createProductSchema,
  addPriceSchema,
  type CreateProductFormValues,
  type AddPriceFormValues,
} from '@/lib/validations';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import PaginationControls from '@/components/ui/pagination-controls';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Plus, Package, Boxes, Tag, Trash2, ImageIcon, Pencil, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import type { Product, PriceDetail } from '@/types';

export default function DashboardProductsPage() {
  const [page, setPage] = useState(0);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // No-inventory warning dialog (shown after product creation if no stock was set)
  const [noInventoryProduct, setNoInventoryProduct] = useState<Product | null>(null);

  // Inventory / pricing dialogs
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [inventoryQty, setInventoryQty] = useState('');
  const [pricingProduct, setPricingProduct] = useState<Product | null>(null);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['business-products', page],
    queryFn: () => businessesApi.getProducts(page, 15),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory', inventoryProduct?.id],
    queryFn: () => inventoryApi.get(inventoryProduct!.id),
    enabled: !!inventoryProduct,
  });

  // ── Create form ──────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { status: 'IN_STOCK' },
  });

  // ── Edit form ────────────────────────────────────────────────────────────────

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
  });

  // ── Price form ───────────────────────────────────────────────────────────────

  const {
    register: registerPrice,
    handleSubmit: handleSubmitPrice,
    control: controlPrice,
    reset: resetPrice,
    formState: { errors: priceErrors },
  } = useForm<AddPriceFormValues>({
    resolver: zodResolver(addPriceSchema),
    defaultValues: { currency: 'NGN' },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: (newProduct) => {
      qc.invalidateQueries({ queryKey: ['business-products'] });
      setCreateOpen(false);
      setImagePreview(null);
      reset();
      // Always prompt about inventory since it's never set during creation
      setNoInventoryProduct(newProduct as unknown as Product);
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to create product.')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateProductFormValues }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Product updated!');
      qc.invalidateQueries({ queryKey: ['business-products'] });
      setEditProduct(null);
      setEditImagePreview(null);
      resetEdit();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update product.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      toast.success('Product deleted.');
      qc.invalidateQueries({ queryKey: ['business-products'] });
      setDeleteProduct(null);
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to delete product.')),
  });

  const saveInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      if (inventory) return inventoryApi.update(productId, quantity);
      return inventoryApi.create({ productId, unitId: inventoryProduct!.prices[0]?.unit ?? 1, quantity });
    },
    onSuccess: () => {
      toast.success('Inventory updated!');
      qc.invalidateQueries({ queryKey: ['inventory', inventoryProduct?.id] });
      setInventoryProduct(null);
      setInventoryQty('');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update inventory.')),
  });

  const addPriceMutation = useMutation({
    mutationFn: ({ productId, dto }: { productId: number; dto: AddPriceFormValues }) =>
      pricingApi.addPrice(productId, dto),
    onSuccess: (newPrice) => {
      toast.success('Price added!');
      qc.invalidateQueries({ queryKey: ['business-products'] });
      if (pricingProduct) {
        setPricingProduct((prev) =>
          prev ? { ...prev, prices: [...prev.prices, newPrice as unknown as PriceDetail] } : prev,
        );
      }
      resetPrice();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to add price.')),
  });

  const deletePriceMutation = useMutation({
    mutationFn: (priceId: number) => pricingApi.deletePrice(priceId),
    onSuccess: (_, priceId) => {
      toast.success('Price removed.');
      qc.invalidateQueries({ queryKey: ['business-products'] });
      if (pricingProduct) {
        setPricingProduct((prev) =>
          prev ? { ...prev, prices: prev.prices.filter((p) => p.id !== priceId) } : prev,
        );
      }
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to delete price.')),
  });

  // ── Image upload helpers ─────────────────────────────────────────────────────

  const handleImageFile = async (file: File, forEdit = false) => {
    const setPreview = forEdit ? setEditImagePreview : setImagePreview;
    const setUploading = forEdit ? setEditImageUploading : setImageUploading;
    const setVal = forEdit ? setEditValue : setValue;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { url } = await productsApi.uploadImage(file);
      setVal('image', url);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(getApiError(err, 'Image upload failed.'));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setEditImagePreview(product.image ?? null);
    resetEdit({
      name: product.name,
      type: product.type ?? '',
      description: product.description ?? '',
      category: product.category ?? undefined,
      image: product.image ?? '',
      status: product.status,
    });
  };

  // ── Shared form body (used in both create + edit dialogs) ───────────────────

  const ProductFormFields = ({
    reg,
    ctrl,
    errs,
    preview,
    uploading,
    inputRef,
    onFileChange,
    onRemoveImage,
  }: {
    reg: typeof register;
    ctrl: typeof control;
    errs: typeof errors;
    preview: string | null;
    uploading: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (file: File) => void;
    onRemoveImage: () => void;
  }) => (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#091426]">Product Name *</Label>
        <Input placeholder="e.g. Fresh Tomatoes" {...reg('name')} />
        {errs.name && <p className="text-xs text-destructive">{errs.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#091426]">Type</Label>
          <Input placeholder="Vegetable" {...reg('type')} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[#091426]">Category</Label>
          <Controller
            name="category"
            control={ctrl}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  {field.value
                    ? (categories?.find((c) => c.id === field.value)?.name ?? String(field.value))
                    : <span className="text-muted-foreground">Select…</span>}
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#091426]">Description</Label>
        <Textarea placeholder="Describe the product…" {...reg('description')} rows={2} />
      </div>

      {/* Image upload zone */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#091426]">Product Image</Label>
        <input type="hidden" {...reg('image')} />
        <div
          className="rounded-xl border-2 border-dashed border-[rgba(9,20,38,0.15)] p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[#0058be]/50 hover:bg-[#f8f9ff] transition-all"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <div className="relative w-full h-32">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-[#94a3b8]" />
              <p className="text-sm text-[#64748b] text-center">
                Click to upload an image
                <br />
                <span className="text-xs">PNG, JPG, WebP — max 5 MB</span>
              </p>
            </>
          )}
          {uploading && (
            <p className="text-xs text-[#0058be] animate-pulse">Uploading…</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
          }}
        />
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onRemoveImage}
          >
            Remove image
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#091426]">Status</Label>
        <Controller
          name="status"
          control={ctrl}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle={`${data?.totalElements ?? 0} total products`}
        action={
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      />

      {/* ── Product grid ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : !data?.content?.length ? (
        <div className="bg-white rounded-2xl shadow-card-md">
          <EmptyState
            icon={Package}
            title="No products yet"
            subtitle="Add your first product to start selling."
            action={{ label: 'Add Product', onClick: () => setCreateOpen(true) }}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.content.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-card-md overflow-hidden">
                {/* Product image */}
                <div className="relative h-36 bg-[#f8f9ff]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-10 w-10 text-[#cbd5e1]" />
                    </div>
                  )}
                  {/* Edit / Delete overlay buttons */}
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => openEditDialog(product)}
                      className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#091426] hover:bg-white transition-colors"
                      title="Edit product"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteProduct(product)}
                      className="h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-red-500 hover:bg-white transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Product info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-[#091426] leading-tight truncate">
                        {product.name}
                      </h3>
                      {product.type && (
                        <p className="text-xs text-[#64748b] mt-0.5">{product.type}</p>
                      )}
                    </div>
                    <StatusBadge status={product.status} type="product" />
                  </div>

                  {product.prices?.length > 0 ? (
                    <div className="space-y-0.5">
                      {product.prices.map((p) => (
                        <p key={p.id} className="text-xs text-[#64748b]">
                          <span className="font-semibold text-[#091426]">
                            {p.currency} {p.price.toLocaleString()}
                          </span>
                          {' / '}{p.unitName}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748b] italic">No prices set</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-[rgba(9,20,38,0.12)] hover:bg-[#eff4ff]"
                      onClick={() => {
                        setInventoryProduct(product);
                        setInventoryQty('');
                      }}
                    >
                      <Boxes className="h-3 w-3 mr-1.5" />
                      Inventory
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-[rgba(9,20,38,0.12)] hover:bg-[#eff4ff]"
                      onClick={() => {
                        setPricingProduct(product);
                        resetPrice();
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1.5" />
                      Prices
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={data.totalPages}
            isFirst={data.first}
            isLast={data.last}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {/* ── Create product dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) { setImagePreview(null); reset(); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((d) => createMutation.mutate(d))}
            className="space-y-4 mt-2"
          >
            <ProductFormFields
              reg={register}
              ctrl={control}
              errs={errors}
              preview={imagePreview}
              uploading={imageUploading}
              inputRef={fileInputRef}
              onFileChange={(f) => handleImageFile(f, false)}
              onRemoveImage={() => {
                setImagePreview(null);
                setValue('image', '');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={createMutation.isPending || imageUploading}
              >
                {createMutation.isPending ? 'Creating…' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit product dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={!!editProduct}
        onOpenChange={(open) => {
          if (!open) { setEditProduct(null); setEditImagePreview(null); resetEdit(); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit — {editProduct?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitEdit((d) => {
              if (!editProduct) return;
              updateMutation.mutate({ id: editProduct.id, data: d });
            })}
            className="space-y-4 mt-2"
          >
            <ProductFormFields
              reg={registerEdit}
              ctrl={controlEdit}
              errs={editErrors}
              preview={editImagePreview}
              uploading={editImageUploading}
              inputRef={editFileInputRef}
              onFileChange={(f) => handleImageFile(f, true)}
              onRemoveImage={() => {
                setEditImagePreview(null);
                setEditValue('image', '');
                if (editFileInputRef.current) editFileInputRef.current.value = '';
              }}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditProduct(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={updateMutation.isPending || editImageUploading}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── No-inventory warning ─────────────────────────────────────────────── */}
      <Dialog
        open={!!noInventoryProduct}
        onOpenChange={(open: boolean) => { if (!open) setNoInventoryProduct(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </span>
              Product created — no inventory set
            </DialogTitle>
          </DialogHeader>

          <div className="mt-1 space-y-3">
            <p className="text-sm text-[#475569] leading-relaxed">
              <span className="font-semibold text-[#091426]">&quot;{noInventoryProduct?.name}&quot;</span> is
              now live on your store. Since you haven&apos;t set a stock quantity, customers
              can still purchase it — the system will treat it as <span className="font-semibold">unlimited stock</span>.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1">
              <p className="font-semibold">What this means:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>Customers can order any quantity at any time</li>
                <li>No automatic &quot;out of stock&quot; protection</li>
                <li>You won&apos;t see stock levels on your dashboard</li>
              </ul>
            </div>
            <p className="text-sm text-[#64748b]">
              You can add inventory at any time using the <span className="font-medium text-[#091426]">Inventory</span> button on the product card.
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setNoInventoryProduct(null)}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 bg-[#091426] text-white hover:bg-[#091426]/90"
              onClick={() => {
                const product = noInventoryProduct;
                setNoInventoryProduct(null);
                // Open inventory dialog for this product
                setInventoryProduct(product);
                setInventoryQty('');
              }}
            >
              <Boxes className="h-4 w-4 mr-2" />
              Add inventory now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteProduct}
        onOpenChange={(open: boolean) => { if (!open) setDeleteProduct(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteProduct?.name}&quot;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b] mt-1">
            This will permanently remove the product from your store. Existing orders are not
            affected.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Inventory dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={!!inventoryProduct}
        onOpenChange={(open) => { if (!open) setInventoryProduct(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inventory — {inventoryProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {inventory && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9ff]">
                <span className="text-sm text-[#64748b]">Current stock</span>
                <span className="font-bold text-[#091426]">{inventory.quantity}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">New Quantity</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 500"
                value={inventoryQty}
                onChange={(e) => setInventoryQty(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setInventoryProduct(null)}>
                Cancel
              </Button>
              <Button
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={!inventoryQty || saveInventoryMutation.isPending}
                onClick={() => {
                  if (!inventoryProduct) return;
                  saveInventoryMutation.mutate({
                    productId: inventoryProduct.id,
                    quantity: Number(inventoryQty),
                  });
                }}
              >
                {saveInventoryMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Pricing dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={!!pricingProduct}
        onOpenChange={(open) => { if (!open) { setPricingProduct(null); resetPrice(); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prices — {pricingProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {pricingProduct?.prices?.length ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">
                  Current Prices
                </p>
                {pricingProduct.prices.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f8f9ff]"
                  >
                    <div>
                      <span className="font-semibold text-sm text-[#091426]">
                        {p.currency} {p.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#64748b] ml-2">per {p.unitName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-[#94a3b8] hover:text-red-500 hover:bg-red-50"
                      disabled={deletePriceMutation.isPending}
                      onClick={() => deletePriceMutation.mutate(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748b] text-center py-2">No prices set yet.</p>
            )}

            <div className="border-t border-[rgba(9,20,38,0.06)] pt-4 space-y-3">
              <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">
                Add New Price
              </p>
              <form
                onSubmit={handleSubmitPrice((values) => {
                  if (!pricingProduct) return;
                  addPriceMutation.mutate({ productId: pricingProduct.id, dto: values });
                })}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#091426]">Unit Name</Label>
                  <Input placeholder="e.g. Bag, Carton, Piece" {...registerPrice('unitName')} />
                  {priceErrors.unitName && (
                    <p className="text-xs text-destructive">{priceErrors.unitName.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#091426]">Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...registerPrice('price', { valueAsNumber: true })}
                    />
                    {priceErrors.price && (
                      <p className="text-xs text-destructive">{priceErrors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#091426]">Currency</Label>
                    <Controller
                      name="currency"
                      control={controlPrice}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">NGN ₦</SelectItem>
                            <SelectItem value="USD">USD $</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#091426] text-white hover:bg-[#091426]/90"
                  disabled={addPriceMutation.isPending}
                >
                  {addPriceMutation.isPending ? 'Adding…' : 'Add Price'}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
