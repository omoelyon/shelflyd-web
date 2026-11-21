import type { Product } from '@/types';

/** Why a product's stock changed. Every change leaves one row in the stock ledger. */
export type StockMovementType = 'INITIAL' | 'RESTOCK' | 'SALE' | 'CANCELLATION' | 'ADJUSTMENT';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: StockMovementType;
  /** Signed change in the product's base unit: positive adds stock, negative removes it. */
  quantity: number;
  /** The product's stock after this change. */
  balanceAfter: number;
  /** The product's cost per base unit (naira) at the time; null when no cost had been entered. */
  unitCost: number | null;
  reason: string | null;
  /** What caused it, e.g. "order:123". */
  reference: string | null;
  orderId: number | null;
  createdAt: string;
}

export interface PagedStockMovements {
  content: StockMovement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface MovementsQuery {
  productId?: number;
  type?: StockMovementType;
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD */
  to?: string;
  page?: number;
  size?: number;
}

/** How long a product's stock will last at its recent selling pace. */
export type CoverStatus = 'OUT' | 'CRITICAL' | 'LOW' | 'OK' | 'NO_SALES' | 'UNTRACKED';

export interface CoverItem {
  productId: number;
  name: string;
  image: string | null;
  baseUnit: string;
  onHand: number;
  costPrice: number | null;
  stockValue: number | null;
  /** Average units sold per day over the last 14 days (base unit). */
  avgDailySales: number;
  daysOfCover: number | null;
  /** YYYY-MM-DD */
  runOutDate: string | null;
  status: CoverStatus;
  lastSaleAt: string | null;
  slowMover: boolean;
}

export interface CoverSummary {
  trackedProducts: number;
  outOfStock: number;
  critical: number;
  low: number;
  /** Null when no product has a cost price yet. */
  totalStockValue: number | null;
  /** Products in stock that have no cost price, so their value is missing from the total. */
  unvaluedProducts: number;
}

export interface StockCover {
  summary: CoverSummary;
  items: CoverItem[];
}

export interface AdjustStockRequest {
  type: 'RESTOCK' | 'ADJUSTMENT';
  /** Signed change in base units. RESTOCK needs a positive number; ADJUSTMENT any non-zero number. */
  change: number;
  reason?: string;
  /** With RESTOCK: what one base unit of this batch cost, so the average cost is kept up to date. */
  unitCost?: number;
}

export interface AdjustStockResult {
  movement: StockMovement;
  onHand: number;
}

/** A request body that may also carry the seller-only cost price (a number to set it, null to clear it). */
export type WithCostPrice<T> = T & { costPrice?: number | null };

/** The seller-only cost per base unit of a product, as returned by the seller's own product list (null when not entered). */
export function costPriceOf(product: Product): number | null {
  const value = (product as Product & { costPrice?: number | null }).costPrice;
  return typeof value === 'number' ? value : null;
}
