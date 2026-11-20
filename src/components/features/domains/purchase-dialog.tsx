'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { domainsApi } from '@/lib/api/domains';
import { getApiError } from '@/lib/utils';
import type { DomainContact, DomainSearchResult } from '@/types';
import { formatNaira } from './format';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
];

type Form = Omit<DomainContact, 'country'> & { country: string };
type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  const required: (keyof Form)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
  for (const key of required) {
    if (!f[key].trim()) e[key] = 'Required';
  }
  if (!e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!e.phone && f.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
  return e;
}

interface Props {
  result: DomainSearchResult | null;
  onClose: () => void;
  defaults: Partial<Form>;
}

/** Collects the domain owner's contact details, then sends the seller to Paystack to pay. */
export default function PurchaseDialog({ result, onClose, defaults }: Props) {
  return (
    <Dialog open={!!result} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {/* The form is mounted only while a domain is chosen, so each purchase starts from fresh defaults. */}
        {result && <PurchaseForm key={result.domain} result={result} onClose={onClose} defaults={defaults} />}
      </DialogContent>
    </Dialog>
  );
}

function PurchaseForm({ result, onClose, defaults }: { result: DomainSearchResult; onClose: () => void; defaults: Partial<Form> }) {
  const [form, setForm] = useState<Form>({
    firstName: defaults.firstName ?? '',
    lastName: defaults.lastName ?? '',
    email: defaults.email ?? '',
    phone: defaults.phone ?? '',
    address: defaults.address ?? '',
    city: defaults.city ?? '',
    state: defaults.state ?? '',
    postalCode: '',
    country: 'NG',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [redirecting, setRedirecting] = useState(false);

  const purchase = useMutation({
    mutationFn: () =>
      domainsApi.purchase({
        domain: result.domain,
        years: result.years || 1,
        contact: Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as unknown as DomainContact,
      }),
    onSuccess: (res) => {
      setRedirecting(true);
      window.location.assign(res.authorizationUrl);
    },
    onError: (error) => toast.error(getApiError(error, 'Could not start the purchase. Try again.')),
  });

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) purchase.mutate();
  };

  const busy = purchase.isPending || redirecting;
  const field = (key: keyof Form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`dom-${key}`}>{label}</Label>
      <Input
        id={`dom-${key}`}
        value={form[key]}
        onChange={set(key)}
        disabled={busy}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `dom-${key}-error` : undefined}
        {...props}
      />
      {errors[key] && (
        <p id={`dom-${key}-error`} className="text-xs text-destructive">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle className="break-all">Buy {result.domain}</DialogTitle>
        <DialogDescription>
          {formatNaira(result.priceNgn)} {result.years === 1 ? 'for one year' : `for ${result.years} years`}. You pay on the next screen.
        </DialogDescription>
      </DialogHeader>

      <p className="rounded-lg bg-[#f8f9ff] px-3 py-2 text-xs text-[#64748b]">
        These details are registered as the domain owner’s contact, as the rules for every domain require. Use the real details of the person or business that owns it.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {field('firstName', 'First name', { autoComplete: 'given-name' })}
        {field('lastName', 'Last name', { autoComplete: 'family-name' })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
        {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '08012345678' })}
      </div>
      {field('address', 'Street address', { autoComplete: 'street-address' })}
      <div className="grid gap-3 sm:grid-cols-2">
        {field('city', 'City', { autoComplete: 'address-level2' })}
        {field('state', 'State / region', { autoComplete: 'address-level1' })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field('postalCode', 'Postcode', { autoComplete: 'postal-code' })}
        <div className="space-y-1.5">
          <Label htmlFor="dom-country">Country</Label>
          <Select value={form.country} onValueChange={(v) => v && setForm((f) => ({ ...f, country: v }))} disabled={busy}>
            <SelectTrigger id="dom-country" className="w-full">
              <SelectValue>{COUNTRIES.find((c) => c.code === form.country)?.name ?? form.country}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy} className="bg-[#0058be] text-white hover:bg-[#0058be]/90">
          {busy ? <Loader2 className="animate-spin" /> : <Lock />}
          {redirecting ? 'Taking you to payment…' : purchase.isPending ? 'Starting…' : `Pay ${formatNaira(result.priceNgn)}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
