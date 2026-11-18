import type { Order, OrderStatus } from '@/types';

/** What to show for an order's status: the label, a key into orderStatusColors, and a one-line meaning. */
export interface DisplayStatus {
  label: string;
  /** Key into `orderStatusColors`. */
  tone: string;
  /** Plain-language meaning for the person looking at it. */
  detail: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/**
 * Four statuses, plus one refinement shown only to people: a pickup order that is still PROCESSING but has been
 * marked ready reads "Ready for pickup" (the buyer was emailed). `audience` only changes the wording of the detail.
 */
export function displayOrderStatus(
  order: Pick<Order, 'status' | 'orderType' | 'readyForPickupAt'>,
  audience: 'buyer' | 'seller' = 'buyer',
): DisplayStatus {
  const pickup = order.orderType === 'PICKUP';
  switch (order.status) {
    case 'PROCESSING':
      if (pickup && order.readyForPickupAt) {
        return {
          label: 'Ready for pickup',
          tone: 'READY_FOR_PICKUP',
          detail: audience === 'buyer' ? 'Your order is packed. Show your pickup code at the store.' : 'The buyer has been told it is ready to collect.',
        };
      }
      return {
        label: 'Processing',
        tone: 'PROCESSING',
        detail: audience === 'buyer' ? 'The seller is preparing your order.' : 'Prepare this order.',
      };
    case 'DISPATCHED':
      return {
        label: 'Dispatched',
        tone: 'DISPATCHED',
        detail: audience === 'buyer' ? 'Your order has left the seller and is on its way.' : 'The order is on its way to the buyer.',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        tone: 'COMPLETED',
        detail: pickup ? 'The order was collected.' : 'The order was delivered.',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        tone: 'CANCELLED',
        detail: audience === 'buyer' ? 'This order was cancelled and you were refunded.' : 'This order was cancelled and the buyer refunded.',
      };
  }
}
