'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { getApiError, formatStatus } from '@/lib/utils';
import { Plus, Package, Boxes, Tag, Trash2, Pencil, ArrowLeftRight, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import ProductImagesField from '@/components/features/products/product-images-field';
import { productImages } from '@/lib/product-images';
import type { Product, PriceDetail, UpdateProductRequest } from '@/types';

export default function DashboardProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  // Edit dialog
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  // The photos are managed outside the form: they are only sent when the seller actually changed them,
  // so editing the name or price can never wipe a product's photos by accident.
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPhotosTouched, setEditPhotosTouched] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);

  // Delete dialog
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Inventory / pricing dialogs
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [inventoryQty, setInventoryQty] = useState('');
  const [pricingProduct, setPricingProduct] = useState<Product | null>(null);
  const [conversionDirection, setConversionDirection] = useState<'new-per-base' | 'base-per-new'>('new-per-base');

  // New-category dialog — usable from either the create or edit product form
  const [categoryDialogTarget, setCategoryDialogTarget] = useState<'edit' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const inventoryBaseUnit =
    inventoryProduct?.prices.find((p) => p.isBaseUnit) ?? inventoryProduct?.prices[0];

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
    watch: watchPrice,
    formState: { errors: priceErrors },
  } = useForm<AddPriceFormValues>({
    resolver: zodResolver(addPriceSchema),
    defaultValues: { currency: 'NGN' },
  });

  const pricingBaseUnit = pricingProduct?.prices.find((p) => p.isBaseUnit) ?? pricingProduct?.prices[0];
  const newPriceUnitName = watchPrice('unitName');
  const isNewNonBaseUnit =
    !!pricingBaseUnit &&
    !!newPriceUnitName?.trim() &&
    !pricingProduct?.prices.some(
      (p) => p.unitName.trim().toLowerCase() === newPriceUnitName.trim().toLowerCase(),
    );

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      toast.success('Product updated!');
      qc.invalidateQueries({ queryKey: ['business-products'] });
      setEditProduct(null);
      setEditImages([]);
      setEditPhotosTouched(false);
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
      return inventoryApi.create({ productId, quantity });
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
      setConversionDirection('new-per-base');
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

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => categoriesApi.createForBusiness({ name }),
    onSuccess: (category) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      if (categoryDialogTarget === 'edit') setEditValue('category', category.id);
      toast.success(`Category "${category.name}" added.`);
      setCategoryDialogTarget(null);
      setNewCategoryName('');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to add category.')),
  });

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setEditImages(productImages(product));
    setEditPhotosTouched(false);
    resetEdit({
      name: product.name,
      type: product.type ?? '',
      description: product.description ?? '',
      category: product.category ?? undefined,
      status: product.status,
    });
  };

  // ── Product form body (edit dialog) ─────────────────────────────────────────

  // A plain function (not a component) so the photo manager inside keeps its state while the form re-renders.
  const renderProductFormFields = ({
    reg,
    ctrl,
    errs,
    onNewCategory,
  }: {
    reg: typeof registerEdit;
    ctrl: typeof controlEdit;
    errs: typeof editErrors;
    onNewCategory: () => void;
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
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-[#091426]">Category</Label>
            <button
              type="button"
              onClick={onNewCategory}
              className="text-xs font-medium text-primary hover:underline"
            >
              + New
            </button>
          </div>
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
                  {categories?.length ? (
                    categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No categories yet — use &quot;+ New&quot; above to add one
                    </div>
                  )}
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

      {/* Photos */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#091426]">Product photos</Label>
        <ProductImagesField
          value={editImages}
          onChange={(urls) => {
            setEditImages(urls);
            setEditPhotosTouched(true);
          }}
          onBusyChange={setEditImageUploading}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#091426]">Status</Label>
        <Controller
          name="status"
          control={ctrl}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue>{field.value ? formatStatus(field.value) : undefined}</SelectValue>
              </SelectTrigger>
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
            onClick={() => router.push('/dashboard/products/new')}
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add product
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
            title="Add your first product"
            subtitle="Add a photo, a price, and how much you have. It takes about a minute."
            action={{ label: 'Add a product', onClick: () => router.push('/dashboard/products/new') }}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.content.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-card-md overflow-hidden">
                {/* Product image */}
                <div className="relative h-36 bg-[#f8f9ff]">
                  {productImages(product)[0] ? (
                    <Image
                      src={productImages(product)[0]}
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
                  {productImages(product).length > 1 && (
                    <span
                      aria-label={`${productImages(product).length - 1} more ${productImages(product).length - 1 === 1 ? 'photo' : 'photos'}`}
                      className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
                    >
                      +{productImages(product).length - 1}
                    </span>
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
                    (() => {
                      const base = product.prices.find((p) => p.isBaseUnit) ?? product.prices[0];
                      const others = product.prices.length - 1;
                      return (
                        <div className="flex items-end justify-between gap-2">
                          <p className="text-sm text-[#64748b]">
                            <span className="font-bold text-[#091426] font-heading">
                              {base.currency === 'NGN' ? '₦' : `${base.currency} `}
                              {base.price.toLocaleString()}
                            </span>
                            {' / '}{base.unitName}
                            {others > 0 && (
                              <span className="text-xs text-[#94a3b8]"> · +{others} more {others === 1 ? 'unit' : 'units'}</span>
                            )}
                          </p>
                          {typeof product.stock === 'number' && (
                            <p className={`text-xs shrink-0 ${product.stock <= 0 ? 'text-red-600 font-medium' : 'text-[#64748b]'}`}>
                              {product.stock <= 0 ? 'None left' : `${product.stock.toLocaleString()} in stock`}
                            </p>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <p className="flex items-center gap-1.5 text-xs text-amber-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Customers can&apos;t buy this yet
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPricingProduct(product);
                          resetPrice();
                        }}
                        className="text-xs font-semibold text-[#0058be] hover:underline shrink-0"
                      >
                        Set price
                      </button>
                    </div>
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
                      Stock
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

      {/* ── Edit product dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={!!editProduct}
        onOpenChange={(open) => {
          if (!open) { setEditProduct(null); setEditImages([]); setEditPhotosTouched(false); resetEdit(); }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit — {editProduct?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitEdit((d) => {
              if (!editProduct) return;
              // Photos travel separately from the form fields, and only when the seller changed them (an empty list removes them all).
              const { images: _ignored, ...fields } = d;
              void _ignored;
              updateMutation.mutate({
                id: editProduct.id,
                data: { ...fields, ...(editPhotosTouched ? { images: editImages } : {}) },
              });
            })}
            className="space-y-4 mt-2"
          >
            {renderProductFormFields({
              reg: registerEdit,
              ctrl: controlEdit,
              errs: editErrors,
              onNewCategory: () => setCategoryDialogTarget('edit'),
            })}
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
            <DialogTitle>Stock — {inventoryProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {inventoryBaseUnit ? (
              <p className="text-xs text-[#64748b]">
                Stock is tracked in <span className="font-medium text-[#091426]">{inventoryBaseUnit.unitName}</span>
                {inventoryProduct && inventoryProduct.prices.length > 1 ? ' — other units convert automatically' : ''}.
              </p>
            ) : (
              <p className="text-xs text-destructive">
                Add a price/unit for this product before setting inventory.
              </p>
            )}
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
                disabled={!inventoryQty || !inventoryBaseUnit || saveInventoryMutation.isPending}
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
        onOpenChange={(open) => { if (!open) { setPricingProduct(null); resetPrice(); setConversionDirection('new-per-base'); } }}
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
                  const dto =
                    conversionDirection === 'base-per-new' && values.conversionFactor
                      ? { ...values, conversionFactor: 1 / values.conversionFactor }
                      : values;
                  addPriceMutation.mutate({ productId: pricingProduct.id, dto });
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
                {isNewNonBaseUnit && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-sm font-medium text-[#091426]">
                        How many {conversionDirection === 'new-per-base' ? newPriceUnitName : pricingBaseUnit?.unitName} equal 1 {conversionDirection === 'new-per-base' ? pricingBaseUnit?.unitName : newPriceUnitName}?
                      </Label>
                      <button
                        type="button"
                        onClick={() =>
                          setConversionDirection((d) => (d === 'new-per-base' ? 'base-per-new' : 'new-per-base'))
                        }
                        className="shrink-0 text-xs text-[#0058be] hover:underline flex items-center gap-1"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        Switch
                      </button>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.000001"
                      placeholder="e.g. 12"
                      {...registerPrice('conversionFactor', { valueAsNumber: true })}
                    />
                    {priceErrors.conversionFactor && (
                      <p className="text-xs text-destructive">{priceErrors.conversionFactor.message}</p>
                    )}
                    <p className="text-xs text-[#64748b]">
                      Stock is tracked in {pricingBaseUnit?.unitName} — we need this to convert.
                    </p>
                  </div>
                )}
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
                          <SelectTrigger>
                            <SelectValue>
                              {{ NGN: 'NGN ₦', USD: 'USD $' }[field.value as string] ?? field.value}
                            </SelectValue>
                          </SelectTrigger>
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
                  disabled={
                    addPriceMutation.isPending ||
                    (isNewNonBaseUnit && !watchPrice('conversionFactor'))
                  }
                >
                  {addPriceMutation.isPending ? 'Adding…' : 'Add Price'}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New category dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={categoryDialogTarget !== null}
        onOpenChange={(open) => { if (!open) { setCategoryDialogTarget(null); setNewCategoryName(''); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newCategoryName.trim()) createCategoryMutation.mutate(newCategoryName.trim());
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Name *</Label>
              <Input
                placeholder="e.g. Fresh Produce"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Categories are shared across the marketplace — if one with this name already exists, it&apos;ll be reused.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setCategoryDialogTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#091426] text-white hover:bg-[#091426]/90"
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? 'Adding…' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
