/**
 * Courier delivery (Shipbubble) is switched off for now: checkout offers pickup and the seller's own delivery areas
 * only. Set NEXT_PUBLIC_COURIER_DELIVERY=true (and COURIER_DELIVERY_ENABLED=true on the backend) to bring it back.
 */
export const COURIER_DELIVERY = process.env.NEXT_PUBLIC_COURIER_DELIVERY === 'true';
