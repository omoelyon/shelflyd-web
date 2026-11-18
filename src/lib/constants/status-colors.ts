/**
 * Centralised status → Tailwind class maps.
 * All values follow the Aeon colour palette (no harsh borders, soft fills).
 */

export const orderStatusColors: Record<string, string> = {
  PROCESSING: 'bg-blue-50 text-blue-700',
  DISPATCHED: 'bg-cyan-50 text-cyan-700',
  COMPLETED:  'bg-emerald-50 text-emerald-700',
  CANCELLED:  'bg-red-50 text-red-700',
  // Not a real status: a pickup order that is still PROCESSING but already marked ready (see displayOrderStatus).
  READY_FOR_PICKUP: 'bg-indigo-50 text-indigo-700',
};

export const paymentStatusColors: Record<string, string> = {
  paid:    'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed:  'bg-red-50 text-red-700',
};

export const gatewayColors: Record<string, string> = {
  paystack:    'bg-blue-100 text-blue-700',
  flutterwave: 'bg-orange-100 text-orange-700',
  stripe:      'bg-purple-100 text-purple-700',
};

export const businessStatusColors: Record<string, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700',
  PENDING:   'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-red-50 text-red-700',
};

export const teamRoleColors: Record<string, string> = {
  ADMIN:  'bg-purple-100 text-purple-700',
  MEMBER: 'bg-slate-100 text-slate-600',
};

export const inviteStatusColors: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  EXPIRED:  'bg-slate-100 text-slate-500',
};

export const productStatusColors: Record<string, string> = {
  IN_STOCK:    'bg-emerald-50 text-emerald-700',
  LOW_STOCK:   'bg-orange-100 text-orange-700',
  OUT_OF_STOCK:'bg-red-50 text-red-700',
  COMING_SOON: 'bg-blue-100 text-blue-700',
};
