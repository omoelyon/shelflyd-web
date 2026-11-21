'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { documentsApi } from '@/lib/api/documents';
import { businessesApi } from '@/lib/api/businesses';
import { getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentDto, InvoicingSettings } from '@/types/documents';
import DocumentView from './document-view';

/** What the form edits: text boxes hold strings, so blank and missing are the same thing. */
interface Values {
  legalName: string;
  taxId: string;
  businessAddress: string;
  documentPhone: string;
  documentEmail: string;
  vatRegistered: boolean;
  vatRatePercent: string;
  receiptNote: string;
}

const NOTE_MAX = 500;
const DEFAULT_VAT = '7.5';

const toValues = (s: InvoicingSettings): Values => ({
  legalName: s.legalName ?? '',
  taxId: s.taxId ?? '',
  businessAddress: s.businessAddress ?? '',
  documentPhone: s.documentPhone ?? '',
  documentEmail: s.documentEmail ?? '',
  vatRegistered: s.vatRegistered,
  vatRatePercent: String(s.vatRatePercent ?? DEFAULT_VAT),
  receiptNote: s.receiptNote ?? '',
});

const blankToNull = (v: string) => (v.trim() === '' ? null : v.trim());

function toSettings(v: Values): InvoicingSettings {
  const rate = Number(v.vatRatePercent);
  return {
    legalName: blankToNull(v.legalName),
    taxId: blankToNull(v.taxId),
    businessAddress: blankToNull(v.businessAddress),
    documentPhone: blankToNull(v.documentPhone),
    documentEmail: blankToNull(v.documentEmail),
    vatRegistered: v.vatRegistered,
    vatRatePercent: Number.isFinite(rate) ? rate : Number(DEFAULT_VAT),
    receiptNote: blankToNull(v.receiptNote),
  };
}

/** Problems with the values, keyed by field. Empty means the form can be saved. */
function validate(v: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (v.documentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.documentEmail.trim())) {
    errors.documentEmail = 'Enter a valid email address, or leave it blank.';
  }
  if (v.vatRegistered) {
    const rate = Number(v.vatRatePercent);
    if (v.vatRatePercent.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      errors.vatRatePercent = 'Enter a rate between 0 and 100.';
    }
  }
  if (v.receiptNote.length > NOTE_MAX) errors.receiptNote = `Keep this under ${NOTE_MAX} characters.`;
  return errors;
}

/** A sample invoice built from the form as it stands, so the seller sees what their buyers will receive. */
function sampleDocument(v: Values, shopName: string, logo: string | null): DocumentDto {
  const subtotal = 5000;
  const deliveryFee = 1000;
  const serviceFee = 50;
  const total = subtotal + deliveryFee + serviceFee;
  const rate = Number(v.vatRatePercent);
  return {
    type: 'invoice',
    number: 'INV-2026-000123',
    issuedAt: new Date().toISOString(),
    status: 'PAID',
    seller: {
      name: shopName,
      legalName: blankToNull(v.legalName),
      taxId: blankToNull(v.taxId),
      address: blankToNull(v.businessAddress),
      phone: blankToNull(v.documentPhone),
      email: blankToNull(v.documentEmail),
      logo,
    },
    buyer: { name: 'Ada Obi', email: 'ada@example.com', phone: '0803 000 0000' },
    delivery: { type: 'DELIVERY', address: '12 Allen Avenue, Ikeja, Lagos', courier: null, trackingRef: null },
    lines: [{ name: 'Sample item', unit: 'piece', quantity: 2, unitPrice: 2500, lineTotal: subtotal, note: null }],
    subtotal,
    deliveryFee,
    serviceFee,
    vat: v.vatRegistered && Number.isFinite(rate) ? { registered: true, ratePercent: rate, amount: Math.round((((subtotal + deliveryFee) * rate) / (100 + rate)) * 100) / 100, included: true } : null,
    total,
    payment: { reference: 'SAMPLE-REF', paidAt: new Date().toISOString(), method: 'Card' },
    refund: null,
    note: blankToNull(v.receiptNote),
  };
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#091426]">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-[#64748b]">{hint}</p>
      )}
    </div>
  );
}

/** The editable invoicing details plus a live sample. Mount it only once `initial` is loaded. */
export default function InvoicingForm({ initial }: { initial: InvoicingSettings }) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState<Values>(() => toValues(initial));
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [touched, setTouched] = useState(false);

  const { data: profile } = useQuery({ queryKey: ['business-profile'], queryFn: businessesApi.getProfile, staleTime: 5 * 60_000 });

  const errors = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const preview = useMemo(() => sampleDocument(values, profile?.name ?? 'Your shop', profile?.logo ?? null), [values, profile]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const save = useMutation({
    mutationFn: () => documentsApi.saveInvoicing(toSettings(values)),
    onSuccess: (result) => {
      qc.setQueryData(['invoicing-settings'], result);
      const next = toValues(result);
      setSaved(next);
      setValues(next);
      setTouched(false);
      toast.success('Invoicing details saved.');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not save your invoicing details.')),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form
        className="space-y-5 rounded-2xl bg-white p-5 shadow-card-md"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!hasErrors) save.mutate();
        }}
      >
        <Field id="legalName" label="Registered business name" hint="As on your CAC certificate, if it differs from your shop name. Your shop name is then shown as “Trading as”.">
          <Input id="legalName" maxLength={120} value={values.legalName} onChange={(e) => set('legalName', e.target.value)} placeholder="Green Table Foods Ltd" />
        </Field>

        <Field id="taxId" label="Tax Identification Number (TIN)" hint="Printed on your receipts and invoices.">
          <Input id="taxId" maxLength={30} value={values.taxId} onChange={(e) => set('taxId', e.target.value)} placeholder="12345678-0001" autoComplete="off" />
        </Field>

        <Field id="businessAddress" label="Business address">
          <Input id="businessAddress" maxLength={200} value={values.businessAddress} onChange={(e) => set('businessAddress', e.target.value)} placeholder="12 Allen Avenue, Ikeja, Lagos" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="documentPhone" label="Phone on documents">
            <Input id="documentPhone" type="tel" maxLength={30} value={values.documentPhone} onChange={(e) => set('documentPhone', e.target.value)} placeholder="0803 000 0000" />
          </Field>
          <Field id="documentEmail" label="Email on documents" error={touched ? errors.documentEmail : undefined}>
            <Input id="documentEmail" type="email" maxLength={120} value={values.documentEmail} onChange={(e) => set('documentEmail', e.target.value)} placeholder="sales@yourshop.com" aria-invalid={touched && !!errors.documentEmail} />
          </Field>
        </div>

        <div className="space-y-3 rounded-xl border border-[rgba(9,20,38,0.1)] bg-[#f8f9ff] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="vatRegistered" className="text-sm font-medium text-[#091426]">
                I am registered for VAT
              </Label>
              <p className="mt-0.5 text-xs text-[#64748b]">
                Your prices are treated as VAT-inclusive, and receipts show the VAT already inside the total. Leave this off if you are not registered, and no VAT is shown.
              </p>
            </div>
            <Switch id="vatRegistered" checked={values.vatRegistered} onCheckedChange={(on) => set('vatRegistered', on)} aria-label="Registered for VAT" />
          </div>
          {values.vatRegistered && (
            <Field id="vatRatePercent" label="VAT rate (%)" hint="Nigeria’s standard rate is 7.5%." error={touched ? errors.vatRatePercent : undefined}>
              <Input id="vatRatePercent" inputMode="decimal" className="w-28" value={values.vatRatePercent} onChange={(e) => set('vatRatePercent', e.target.value.replace(/[^\d.]/g, '').slice(0, 6))} aria-invalid={touched && !!errors.vatRatePercent} />
            </Field>
          )}
        </div>

        <Field id="receiptNote" label="Note at the foot of documents" hint="For example your returns policy, bank details for transfers, or a thank-you." error={errors.receiptNote}>
          <Textarea id="receiptNote" rows={4} value={values.receiptNote} onChange={(e) => set('receiptNote', e.target.value)} placeholder="Thank you for shopping with us. Goods once sold can be exchanged within 7 days with this receipt." />
          <p className={`text-right text-[11px] tabular-nums ${values.receiptNote.length > NOTE_MAX ? 'text-destructive' : 'text-[#94a3b8]'}`}>
            {values.receiptNote.length}/{NOTE_MAX}
          </p>
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-[rgba(9,20,38,0.08)] pt-4">
          {dirty && (
            <Button type="button" variant="ghost" onClick={() => { setValues(saved); setTouched(false); }} disabled={save.isPending}>
              Discard changes
            </Button>
          )}
          <Button type="submit" disabled={!dirty || save.isPending} className="bg-[#091426] text-white hover:bg-[#091426]/90">
            {save.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>

      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start" aria-label="Sample invoice">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">How your invoices will look</p>
        <div className="pointer-events-none max-h-[560px] select-none overflow-hidden rounded-2xl bg-[#eef2f7] p-2" aria-hidden>
          {/* A shrunken copy of the real document, so spacing and wording are exactly what buyers get. */}
          <div style={{ zoom: 0.5 }}>
            <DocumentView doc={preview} />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#64748b]">Sample items and prices. Real documents use each order&rsquo;s details.</p>
      </aside>
    </div>
  );
}
