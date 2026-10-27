'use client';

import Link from 'next/link';
import type { BusinessStats } from '@/types';

/** A compact row of the order statuses that actually have orders — no grid of zeros. */
export default function OrdersAtAGlance({ stats }: { stats: BusinessStats }) {
  if (stats.totalOrders === 0) return null;

  const items = [
    { label: 'Awaiting payment', value: stats.createdOrders },
    { label: 'Paid', value: stats.paidOrders },
    { label: 'Preparing', value: stats.preparingOrders },
    { label: 'Ready for pickup', value: stats.readyForPickupOrders },
    { label: 'Ready for delivery', value: stats.readyForDeliveryOrders },
    { label: 'Out for delivery', value: stats.outForDeliveryOrders },
    { label: 'Delivered', value: stats.deliveredOrders },
    { label: 'Picked up', value: stats.pickedUpOrders },
  ].filter((i) => i.value > 0);

  return (
    <section aria-labelledby="glance-heading" className="bg-white rounded-2xl shadow-card-md p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="glance-heading" className="font-bold text-sm text-[#091426] font-heading">
          Orders at a glance
        </h2>
        <p className="text-xs text-[#64748b]">
          {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'} in total
        </p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors px-3 py-1.5 text-xs text-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0058be]"
            >
              <span className="font-bold text-[#091426] tabular-nums">{item.value}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
