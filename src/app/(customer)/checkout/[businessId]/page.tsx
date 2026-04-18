'use client';

import { use } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { deliveryApi } from '@/lib/api/delivery';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, type CheckoutFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Truck, Store, MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ businessId: string }>;
}

export default function CheckoutPage({ params }: Props) {
  const { businessId } = use(params);
  const cartId = Number(businessId);

  const { data: carts, isLoading: cartLoading } = useQuery({
    queryKey: ['carts'],
    queryFn: cartApi.getAll,
  });

  const cart = carts?.find((c) => c.cartId === cartId);

  const { data: locations } = useQuery({
    queryKey: ['delivery-locations'],
    queryFn: deliveryApi.list,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { orderType: 'PICKUP' },
  });

  const orderType = watch('orderType');

  const checkoutMutation = useMutation({
    mutationFn: (data: CheckoutFormValues) =>
      cartApi.checkout({
        cartId,
        orderType: data.orderType,
        locationId: data.orderType === 'DELIVERY' ? data.locationId : undefined,
      }),
    onSuccess: (result) => {
      toast.success('Redirecting to payment...');
      window.location.href = result.url;
    },
    onError: (error) => toast.error(getApiError(error, 'Checkout failed. Please try again.')),
  });

  if (cartLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Order summary */}
      {cart && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cart.products.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{p.name} × {p.quantity}</span>
                <span className="font-medium">₦{p.totalPrice.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">₦{cart.totalCost.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout form */}
      <form onSubmit={handleSubmit((d) => checkoutMutation.mutate(d as CheckoutFormValues))} className="space-y-6">
        {/* Order type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fulfilment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="orderType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'PICKUP', label: 'Pickup', icon: Store, desc: 'Collect from store' },
                    { value: 'DELIVERY', label: 'Delivery', icon: Truck, desc: 'Delivered to you' },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        field.value === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 ${field.value === value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Delivery location */}
        {orderType === 'DELIVERY' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="locationId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a delivery location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {loc.location} — ₦{loc.amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.locationId && (
                <p className="text-xs text-destructive mt-1">{errors.locationId.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:opacity-90"
          size="lg"
          disabled={checkoutMutation.isPending}
        >
          {checkoutMutation.isPending ? 'Processing...' : 'Pay Now'}
        </Button>
      </form>
    </div>
  );
}
