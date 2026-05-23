'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.list,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', icon: '' });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setValue('name', cat.name);
    setValue('description', cat.description ?? '');
    setValue('icon', cat.icon ?? '');
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing
        ? categoriesApi.update(editing.id, values)
        : categoriesApi.create(values),
    onSuccess: () => {
      toast.success(editing ? 'Category updated!' : 'Category created!');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      setEditing(null);
      reset();
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to save category.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success('Category deleted.');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to delete category.')),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Categories"
        subtitle={`${categories?.length ?? 0} categories on the platform`}
        action={
          <Button
            onClick={openCreate}
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : !categories?.length ? (
          <EmptyState
            icon={Tag}
            title="No categories yet"
            subtitle="Create categories to organise products on the marketplace."
            action={{ label: 'Create Category', onClick: openCreate }}
          />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f9ff] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#eff4ff] flex items-center justify-center shrink-0 text-xl">
                    {cat.icon || <Tag className="h-4 w-4 text-[#0058be]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#091426]">{cat.name}</p>
                    <p className="text-xs text-[#64748b]">
                      {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                      {cat.description && ` · ${cat.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff]"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#94a3b8] hover:text-red-500 hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(cat.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); reset(); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Name *</Label>
              <Input placeholder="e.g. Fresh Produce" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Description</Label>
              <Input placeholder="Short description" {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#091426]">Icon (emoji)</Label>
              <Input placeholder="🥦" {...register('icon')} />
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
                {saveMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
