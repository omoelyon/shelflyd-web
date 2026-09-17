'use client';

import { use, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { deliveryApi } from '@/lib/api/delivery';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, type CheckoutFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Truck, Store, MapPin } from 'lucide-react';
import DeliveryMethodPicker, { type DeliveryMethodValue } from '@/components/features/checkout/delivery-method-picker';

interface Props {
  params: Promise<{ cartId: string }>;
}

export default function CheckoutPage({ params }: Props) {
  const { cartId: cartIdParam } = use(params);
  const cartId = Number(cartIdParam);

  const { data: carts, isLoading: cartLoading } = useQuery({
    queryKey: ['carts'],
    queryFn: cartApi.getAll,
  });

  const cart = carts?.find((c) => c.cartId === cartId);

  const { data: locations } = useQuery({
    queryKey: ['delivery-locations', cart?.businessId],
    queryFn: () => deliveryApi.listByBusiness(cart!.businessId),
    enabled: !!cart?.businessId,
  });

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { orderType: 'PICKUP' },
  });

  const orderType = watch('orderType');
  const [delivery, setDelivery] = useState<DeliveryMethodValue>({ mode: 'flat' });

  const checkoutMutation = useMutation({
    mutationFn: (data: CheckoutFormValues) =>
      cartApi.checkout({
        cartId,
        orderType: data.orderType,
        locationId: data.orderType === 'DELIVERY' && delivery.mode === 'flat' ? delivery.locationId : undefined,
        courierRequestToken: data.orderType === 'DELIVERY' && delivery.mode === 'courier' ? delivery.courierRequestToken : undefined,
        courierServiceCode: data.orderType === 'DELIVERY' && delivery.mode === 'courier' ? delivery.courierServiceCode : undefined,
        courierId: data.orderType === 'DELIVERY' && delivery.mode === 'courier' ? delivery.courierId : undefined,
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

        {/* Delivery method */}
        {orderType === 'DELIVERY' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMethodPicker
                cartId={cartId}
                locations={locations}
                value={delivery}
                onChange={setDelivery}
              />
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
