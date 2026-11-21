/** Receipts, invoices, delivery notes and credit notes, and the invoicing details printed on them. */

/** The document kinds, as they appear in the API path. */
export type DocumentType = 'receipt' | 'invoice' | 'delivery-note' | 'credit-note';

export interface DocumentParty {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface DocumentSeller {
  /** The trading name shoppers know. */
  name: string;
  /** The registered business or company name, when it differs from the trading name. */
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

export interface DocumentDelivery {
  type: 'DELIVERY' | 'PICKUP';
  address: string | null;
  courier: string | null;
  trackingRef: string | null;
}

export interface DocumentLine {
  name: string;
  unit: string | null;
  quantity: number;
  /** Null on a delivery note, which carries no prices. */
  unitPrice: number | null;
  lineTotal: number | null;
  note: string | null;
}

export interface DocumentVat {
  registered: boolean;
  ratePercent: number;
  /** The VAT portion already inside the prices. */
  amount: number;
  included: boolean;
}

export interface DocumentPayment {
  reference: string | null;
  paidAt: string | null;
  method: string | null;
}

export interface DocumentRefund {
  amount: number;
  at: string | null;
  reason: string | null;
}

/** One printable document, exactly as the backend returns it. */
export interface DocumentDto {
  /** Normalise with `normaliseDocumentType` before comparing: the server may send it in upper case. */
  type: string;
  number: string;
  issuedAt: string;
  status: string;
  seller: DocumentSeller;
  buyer: DocumentParty;
  delivery: DocumentDelivery | null;
  lines: DocumentLine[];
  subtotal: number | null;
  deliveryFee: number | null;
  serviceFee: number | null;
  /** The payment processing fee the buyer paid on top; without it the lines would not add up to the total. */
  processingFee?: number | null;
  vat: DocumentVat | null;
  total: number | null;
  payment: DocumentPayment | null;
  refund: DocumentRefund | null;
  note: string | null;
}

/** The business's details printed on its documents. Every text field may be blank. */
export interface InvoicingSettings {
  legalName: string | null;
  taxId: string | null;
  businessAddress: string | null;
  documentPhone: string | null;
  documentEmail: string | null;
  vatRegistered: boolean;
  vatRatePercent: number;
  receiptNote: string | null;
}
