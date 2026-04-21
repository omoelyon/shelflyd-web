'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { productsApi } from '@/lib/api/products';
import { inventoryApi } from '@/lib/api/inventory';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, type CreateProductFormValues } from '@/lib/validations';
import { toast } from 'sonner';
import { getApiError, formatStatus } from '@/lib/utils';
import { Plus, Package, Boxes } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/types';

const statusColors: Record<string, string> = {
  IN_STOCK: 'bg-green-100 text-green-700',
  LOW_STOCK: 'bg-orange-100 text-orange-700',
  OUT_OF_STOCK: 'bg-red-100 text-red-700',
  COMING_SOON: 'bg-blue-100 text-blue-700',
};

export default function DashboardProductsPage() {
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [inventoryQty, setInventoryQty] = useState('');
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { status: 'IN_STOCK' },
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      toast.success('Product created!');
      qc.invalidateQueries({ queryKey: ['business-products'] });
      setDialogOpen(false);
      reset();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to create product.')),
  });

  const saveInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      if (inventory) {
        return inventoryApi.update(productId, quantity);
      }
      return inventoryApi.create({ productId, unitId: inventoryProduct!.prices[0]?.unitId ?? 1, quantity });
    },
    onSuccess: () => {
      toast.success('Inventory updated!');
      qc.invalidateQueries({ queryKey: ['inventory', inventoryProduct?.id] });
      setInventoryProduct(null);
      setInventoryQty('');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update inventory.')),
  });

  const handleOpenInventory = (product: Product) => {
    setInventoryProduct(product);
    setInventoryQty('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.totalElements ?? 0} total products
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : data?.content?.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <Package className="h-14 w-14 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No products yet. Add your first product.</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.content.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-36 bg-muted">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      {product.type && <p className="text-xs text-muted-foreground">{product.type}</p>}
                    </div>
                    <Badge variant="secondary" className={statusColors[product.status]}>
                      {formatStatus(product.status)}
                    </Badge>
                  </div>
                  {product.prices?.length > 0 && (
                    <p className="text-sm font-semibold text-primary mt-2">
                      From {product.prices[0].currency} {product.prices[0].price.toLocaleString()}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleOpenInventory(product)}
                  >
                    <Boxes className="h-3 w-3 mr-1" />
                    Manage Inventory
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.pageable.pageNumber + 1} of {data.totalPages}
              </span>
              <Button variant="outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data as CreateProductFormValues))}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1">
              <Label>Product Name *</Label>
              <Input placeholder="Fresh Tomatoes" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Input placeholder="Vegetable" {...register('type')} />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
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

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Describe the product..." {...register('description')} rows={3} />
            </div>

            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input placeholder="https://..." {...register('image')} />
              {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
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

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:opacity-90"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inventory dialog */}
      <Dialog open={!!inventoryProduct} onOpenChange={(open) => { if (!open) setInventoryProduct(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inventory — {inventoryProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {inventory && (
              <p className="text-sm text-muted-foreground">
                Current stock: <span className="font-semibold text-foreground">{inventory.quantity}</span>
              </p>
            )}
            <div className="space-y-1">
              <Label>New Quantity</Label>
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
                className="bg-primary text-primary-foreground hover:opacity-90"
                disabled={!inventoryQty || saveInventoryMutation.isPending}
                onClick={() => {
                  if (!inventoryProduct) return;
                  saveInventoryMutation.mutate({
                    productId: inventoryProduct.id,
                    quantity: Number(inventoryQty),
                  });
                }}
              >
                {saveInventoryMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
