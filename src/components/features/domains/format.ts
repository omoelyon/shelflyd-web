/** A naira amount like ₦12,500 (whole naira, thousands separated). */
export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}
