import type { DocumentDto, DocumentType } from '@/types/documents';

const LAGOS = 'Africa/Lagos';

/** ₦1,234.50 with two decimals; an em dash when there is no amount. */
export function naira(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A quantity without trailing zeros: 2, 2.5, 0.125. */
export function quantity(value: number): string {
  return value.toLocaleString('en-NG', { maximumFractionDigits: 3 });
}

/** "20 Nov 2026" in Lagos time, whatever the browser's own time zone is. */
export function lagosDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { timeZone: LAGOS, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

/** "20 Nov 2026, 14:05" in Lagos time. */
export function lagosDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '—';
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: LAGOS, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: LAGOS, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return `${date}, ${time}`;
}

/** The server may send "RECEIPT", "DELIVERY_NOTE" or "delivery-note": all mean the same document. */
export function normaliseDocumentType(raw: string | null | undefined): DocumentType {
  const t = (raw ?? '').toLowerCase().replace(/_/g, '-');
  if (t === 'invoice' || t === 'delivery-note' || t === 'credit-note') return t;
  return 'receipt';
}

/** The heading on the page. An invoice from a VAT-registered seller is a tax invoice. */
export function documentTitle(doc: Pick<DocumentDto, 'type' | 'vat'>): string {
  switch (normaliseDocumentType(doc.type)) {
    case 'invoice':
      return doc.vat?.registered ? 'Tax invoice' : 'Invoice';
    case 'delivery-note':
      return 'Delivery note';
    case 'credit-note':
      return 'Credit note';
    default:
      return 'Receipt';
  }
}

/** "PAID" -> "Paid", "READY_FOR_PICKUP" -> "Ready for pickup". */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return '';
  const s = status.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The documents a seller can open for an order, in the order the buttons appear. */
export const SELLER_DOCUMENTS: { type: DocumentType; label: string; hint: string }[] = [
  { type: 'receipt', label: 'Receipt', hint: 'Proof of payment for the buyer' },
  { type: 'invoice', label: 'Invoice', hint: 'A bill with your tax details' },
  { type: 'delivery-note', label: 'Delivery note', hint: 'What to pack, with no prices' },
  { type: 'credit-note', label: 'Credit note', hint: 'For a cancelled or refunded order' },
];
