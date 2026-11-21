// Finance: profit & loss, expenses and CSV reports. Shapes follow the accounting contract (Worker B / Worker C).

export type ExpenseCategory =
  | 'STOCK_PURCHASE'
  | 'DELIVERY'
  | 'RENT'
  | 'SALARIES'
  | 'MARKETING'
  | 'UTILITIES'
  | 'EQUIPMENT'
  | 'FEES'
  | 'OTHER';

export interface Expense {
  id: number;
  /** YYYY-MM-DD, Lagos time */
  date: string;
  category: ExpenseCategory;
  /** Naira */
  amount: number;
  vendor?: string | null;
  note?: string | null;
  createdAt?: string;
}

export interface ExpenseInput {
  date: string;
  category: ExpenseCategory;
  amount: number;
  vendor?: string | null;
  note?: string | null;
}

export interface PagedExpenses {
  content: Expense[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ExpenseCategoryTotal {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  total: number;
  byCategory: ExpenseCategoryTotal[];
}

export interface ProfitLossProduct {
  productId: number;
  name: string;
  unitsSold: number;
  revenue: number;
  /** Null when this product has no cost price. */
  cogs: number | null;
  margin: number | null;
  marginPct: number | null;
}

export interface MissingCostProduct {
  productId: number;
  name: string;
  revenue: number;
}

export interface ProfitLoss {
  from: string;
  to: string;
  revenue: number;
  refunds: number;
  /** Money spent on stock in the period. Not part of `expenses` (it is already in the cost of goods sold); shown as a note. */
  stockPurchases?: number;
  platformFees: number;
  paymentFees: number;
  netSales: number;
  /** Null until cost prices exist for what was sold. */
  cogs: number | null;
  grossProfit: number | null;
  grossMarginPct: number | null;
  expenses: {
    total: number;
    byCategory: { category: ExpenseCategory; total: number }[];
  };
  netProfit: number | null;
  /** Share of revenue that comes from products with a cost price, 0 to 100. */
  costCoveragePct: number;
  missingCostProducts: MissingCostProduct[];
  byProduct: ProfitLossProduct[];
}

/** The CSV files a seller can download for their accountant. */
export type ExportKind = 'sales' | 'payouts' | 'stock-movements' | 'inventory-valuation' | 'expenses';

export interface ExpenseListParams {
  from?: string;
  to?: string;
  category?: ExpenseCategory;
  page?: number;
  size?: number;
}
