'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Loader2, MapPin, Truck } from 'lucide-react';
import type { DeliveryAddress, DeliveryLocation, DeliveryRateOption } from '@/types';

export interface DeliveryMethodValue {
  mode: 'flat' | 'courier';
  locationId?: number;
  courierRequestToken?: string;
  courierServiceCode?: string;
  courierId?: number;
}

interface Props {
  cartId: number;
  locations: DeliveryLocation[] | undefined;
  value: DeliveryMethodValue;
  onChange: (value: DeliveryMethodValue) => void;
}

const emptyAddress: DeliveryAddress = { name: '', phone: '', addressLine: '', city: '', state: '' };

export default function DeliveryMethodPicker({ cartId, locations, value, onChange }: Props) {
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress);
  const [options, setOptions] = useState<DeliveryRateOption[]>([]);

  const quoteMutation = useMutation({
    mutationFn: () => cartApi.getDeliveryQuotes(cartId, address),
    onSuccess: (quote) => {
      setOptions(quote.options);
      if (!quote.options.length) {
        toast.error('No courier options available for this address right now.');
      }
    },
    onError: (error) => {
      setOptions([]);
      toast.error(getApiError(error, 'Could not get delivery rates. Please check the address and try again.'));
    },
  });

  const addressComplete = Object.values(address).every((v) => v.trim().length > 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ mode: 'flat' })}
          className={`p-3 rounded-xl border-2 text-left transition-colors ${
            value.mode === 'flat' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
          }`}
        >
          <MapPin className={`h-4 w-4 mb-1.5 ${value.mode === 'flat' ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="font-medium text-sm">Flat-rate delivery</p>
          <p className="text-xs text-muted-foreground">Pick a zone the seller set up</p>
        </button>
        <button
          type="button"
          onClick={() => onChange({ mode: 'courier' })}
          className={`p-3 rounded-xl border-2 text-left transition-colors ${
            value.mode === 'courier' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
          }`}
        >
          <Truck className={`h-4 w-4 mb-1.5 ${value.mode === 'courier' ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="font-medium text-sm">Courier delivery</p>
          <p className="text-xs text-muted-foreground">Real rates, live tracking</p>
        </button>
      </div>

      {value.mode === 'flat' && (
        <Select
          value={value.locationId ? String(value.locationId) : ''}
          onValueChange={(v) => onChange({ mode: 'flat', locationId: Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a delivery location...">
              {(() => {
                const loc = locations?.find((l) => l.id === value.locationId);
                return loc ? `${loc.location} — ₦${loc.amount.toLocaleString()}` : undefined;
              })()}
            </SelectValue>
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

      {value.mode === 'courier' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Full name</Label>
              <Input
                value={address.name}
                onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                placeholder="Recipient's name"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Phone number</Label>
              <Input
                value={address.phone}
                onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                placeholder="080..."
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Delivery address</Label>
              <Input
                value={address.addressLine}
                onChange={(e) => setAddress((a) => ({ ...a, addressLine: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Input
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!addressComplete || quoteMutation.isPending}
            onClick={() => quoteMutation.mutate()}
          >
            {quoteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting rates...
              </>
            ) : (
              'Get Rates'
            )}
          </Button>

          {options.length > 0 && (
            <div className="space-y-2">
              {options.map((option) => {
                const selected =
                  value.courierId === option.courierId && value.courierServiceCode === option.serviceCode;
                return (
                  <button
                    key={`${option.courierId}-${option.serviceCode}`}
                    type="button"
                    onClick={() =>
                      onChange({
                        mode: 'courier',
                        courierId: option.courierId,
                        courierServiceCode: option.serviceCode,
                        courierRequestToken: quoteMutation.data?.requestToken,
                      })
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-colors ${
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{option.courierName}</p>
                      {option.deliveryEta && (
                        <p className="text-xs text-muted-foreground">Arrives {option.deliveryEta}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary shrink-0">
                      ₦{option.amount.toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
