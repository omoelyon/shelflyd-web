import Image from 'next/image';
import type { DocumentDto } from '@/types/documents';
import { documentTitle, lagosDate, lagosDateTime, naira, normaliseDocumentType, quantity, statusLabel } from './format';

/** Muted label above each block ("Billed to", "Payment"). */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">{children}</p>;
}

/** A line of text that is skipped when empty. */
function Line({ children, strong }: { children?: React.ReactNode; strong?: boolean }) {
  if (children === null || children === undefined || children === '') return null;
  return <p className={strong ? 'font-semibold text-[#0f172a]' : 'text-[#334155]'}>{children}</p>;
}

/**
 * One receipt, invoice, delivery note or credit note, laid out like an A4 page. All colours are fixed (never theme
 * tokens) so it prints black on white in light and dark mode alike. Wide parts stack on a phone and sit side by
 * side from 640px up, which is also how it lays out on paper.
 */
export default function DocumentView({ doc }: { doc: DocumentDto }) {
  const type = normaliseDocumentType(doc.type);
  const isDeliveryNote = type === 'delivery-note';
  const isCreditNote = type === 'credit-note';
  const showPrices = !isDeliveryNote;
  const title = documentTitle(doc);

  const { seller } = doc;
  const legalName = seller.legalName?.trim() || seller.name;
  const tradingAs = seller.legalName?.trim() && seller.legalName.trim() !== seller.name ? seller.name : null;

  const credit = isCreditNote ? (doc.refund?.amount ?? doc.total) : null;
  const delivery = doc.delivery;
  const paid = !!doc.payment;

  return (
    <article className="doc-sheet mx-auto w-full max-w-[794px] bg-white p-5 text-[13px] leading-relaxed text-[#0f172a] shadow-card-md sm:p-10">
      {/* Seller and document identity */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between print:flex-row">
        <div className="flex min-w-0 items-start gap-3">
          {seller.logo && (
            <Image src={seller.logo} alt="" width={56} height={56} unoptimized loading="eager" className="h-14 w-14 shrink-0 rounded-lg border border-[#e2e8f0] object-contain" />
          )}
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight text-[#0f172a]">{legalName}</p>
            {tradingAs && <p className="text-[#64748b]">Trading as {tradingAs}</p>}
            {seller.taxId && <p className="mt-1 text-[#334155]">TIN: {seller.taxId}</p>}
            <Line>{seller.address}</Line>
            <Line>{[seller.phone, seller.email].filter(Boolean).join(' · ')}</Line>
          </div>
        </div>

        <div className="sm:text-right print:text-right">
          <p className="text-2xl font-bold tracking-tight text-[#0f172a]">{title}</p>
          <p className="mt-1 font-mono text-[12px] text-[#334155]">{doc.number}</p>
          <p className="text-[#64748b]">Issued {lagosDate(doc.issuedAt)}</p>
          {doc.status && !isDeliveryNote && <p className="text-[#64748b]">Order status: {statusLabel(doc.status)}</p>}
          {!isDeliveryNote && !isCreditNote && paid && (
            <span className="mt-2 inline-block rounded border-2 border-[#15803d] px-2 py-0.5 text-[11px] font-bold tracking-[0.14em] text-[#15803d]">PAID</span>
          )}
        </div>
      </header>

      {/* Buyer and delivery */}
      <section className="mt-6 grid gap-5 border-t border-[#e2e8f0] pt-5 sm:grid-cols-2 print:grid-cols-2 break-inside-avoid">
        <div>
          <Label>{isDeliveryNote ? 'Deliver to' : isCreditNote ? 'Credited to' : 'Billed to'}</Label>
          <Line strong>{doc.buyer.name}</Line>
          <Line>{doc.buyer.phone}</Line>
          {!isDeliveryNote && <Line>{doc.buyer.email}</Line>}
          {isDeliveryNote && <Line>{delivery?.address}</Line>}
        </div>
        <div>
          <Label>{delivery?.type === 'PICKUP' ? 'Pickup' : 'Delivery'}</Label>
          {delivery ? (
            <>
              <Line strong>{delivery.type === 'PICKUP' ? 'Collected in store' : 'Delivered to the buyer'}</Line>
              {!isDeliveryNote && <Line>{delivery.address}</Line>}
              {delivery.courier && <Line>Courier: {delivery.courier}</Line>}
              {delivery.trackingRef && <Line>Tracking: {delivery.trackingRef}</Line>}
            </>
          ) : (
            <p className="text-[#64748b]">No delivery details</p>
          )}
        </div>
      </section>

      {/* Items */}
      <section className="mt-6">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f1f5f9] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#475569]">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2 text-right">Qty</th>
                {showPrices && <th className="px-3 py-2 text-right">Unit price</th>}
                {showPrices && <th className="px-3 py-2 text-right">Amount</th>}
                {isDeliveryNote && <th className="w-16 px-3 py-2 text-center">Packed</th>}
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((line, i) => (
                <tr key={`${line.name}-${i}`} className="break-inside-avoid border-b border-[#e2e8f0] align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium text-[#0f172a]">{line.name}</p>
                    {line.note && <p className="text-[11px] italic text-[#64748b]">Note: {line.note}</p>}
                  </td>
                  <td className="px-3 py-2 text-[#334155]">{line.unit ?? ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{quantity(line.quantity)}</td>
                  {showPrices && <td className="px-3 py-2 text-right tabular-nums">{naira(line.unitPrice)}</td>}
                  {showPrices && <td className="px-3 py-2 text-right tabular-nums">{naira(line.lineTotal)}</td>}
                  {isDeliveryNote && (
                    <td className="px-3 py-2 text-center">
                      <span aria-hidden className="inline-block h-4 w-4 rounded-sm border border-[#64748b]" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Totals */}
      {showPrices && (
        <section className="mt-5 flex justify-end break-inside-avoid">
          <dl className="w-full max-w-[300px] space-y-1.5">
            <div className="flex justify-between gap-6">
              <dt className="text-[#64748b]">Subtotal</dt>
              <dd className="tabular-nums">{naira(doc.subtotal)}</dd>
            </div>
            {!!doc.deliveryFee && doc.deliveryFee > 0 && (
              <div className="flex justify-between gap-6">
                <dt className="text-[#64748b]">Delivery</dt>
                <dd className="tabular-nums">{naira(doc.deliveryFee)}</dd>
              </div>
            )}
            {!!doc.serviceFee && doc.serviceFee > 0 && (
              <div className="flex justify-between gap-6">
                <dt className="text-[#64748b]">Service fee</dt>
                <dd className="tabular-nums">{naira(doc.serviceFee)}</dd>
              </div>
            )}
            {!!doc.processingFee && doc.processingFee > 0 && (
              <div className="flex justify-between gap-6">
                <dt className="text-[#64748b]">Payment processing fee</dt>
                <dd className="tabular-nums">{naira(doc.processingFee)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-6 border-t border-[#0f172a] pt-1.5 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{naira(doc.total)}</dd>
            </div>
            {doc.vat?.registered && (
              <div className="flex justify-between gap-6 text-[12px] text-[#64748b]">
                <dt>Includes VAT ({doc.vat.ratePercent}%)</dt>
                <dd className="tabular-nums">{naira(doc.vat.amount)}</dd>
              </div>
            )}
            {isCreditNote && credit !== null && (
              <div className="flex justify-between gap-6 rounded bg-[#fef2f2] px-2 py-1.5 text-base font-bold text-[#b91c1c]">
                <dt>Credited to the buyer</dt>
                <dd className="tabular-nums">{naira(credit)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Payment and refund */}
      {(doc.payment || doc.refund || (type === 'invoice' && !doc.payment)) && !isDeliveryNote && (
        <section className="mt-6 grid gap-5 border-t border-[#e2e8f0] pt-5 sm:grid-cols-2 print:grid-cols-2 break-inside-avoid">
          <div>
            <Label>Payment</Label>
            {doc.payment ? (
              <>
                <Line strong>Paid {lagosDateTime(doc.payment.paidAt)}</Line>
                {doc.payment.method && <Line>Method: {doc.payment.method}</Line>}
                {doc.payment.reference && <p className="break-all font-mono text-[11px] text-[#334155]">Ref: {doc.payment.reference}</p>}
              </>
            ) : (
              <Line strong>Awaiting payment</Line>
            )}
          </div>
          {doc.refund && (
            <div>
              <Label>Refund</Label>
              <Line strong>{naira(doc.refund.amount)} refunded</Line>
              <Line>{lagosDateTime(doc.refund.at)}</Line>
              {doc.refund.reason && <Line>Reason: {doc.refund.reason}</Line>}
            </div>
          )}
        </section>
      )}

      {/* Footer note */}
      {doc.note && (
        <section className="mt-6 border-t border-[#e2e8f0] pt-4 break-inside-avoid">
          <p className="whitespace-pre-line text-[12px] text-[#475569]">{doc.note}</p>
        </section>
      )}

      <footer className="mt-8 border-t border-[#e2e8f0] pt-3 text-center text-[10px] text-[#94a3b8]">
        {doc.number} · Prepared with Shelflyd
      </footer>
    </article>
  );
}
