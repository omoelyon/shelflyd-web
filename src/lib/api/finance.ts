import axios from 'axios';
import apiClient from './client';
import type {
  Expense,
  ExpenseInput,
  ExpenseListParams,
  ExpenseSummary,
  ExportKind,
  PagedExpenses,
  ProfitLoss,
} from '@/types/finance';

/** The filename the server suggests in Content-Disposition, if it sent one. */
function filenameFrom(disposition: string | undefined): string | null {
  if (!disposition) return null;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : null;
}

/** An error from a request made with `responseType: 'blob'` has its JSON body inside a Blob; read the server's message out of it. */
async function blobErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const parsed = JSON.parse(await error.response.data.text()) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // not JSON: use the fallback
    }
  }
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export const financeApi = {
  getProfitLoss: async (from: string, to: string): Promise<ProfitLoss> => {
    const res = await apiClient.get('/business/insights/profit-loss', { params: { from, to } });
    return res.data;
  },

  listExpenses: async (params: ExpenseListParams = {}): Promise<PagedExpenses> => {
    const res = await apiClient.get('/business/expenses', { params: { page: 0, size: 15, ...params } });
    return res.data;
  },

  getExpenseSummary: async (from: string, to: string): Promise<ExpenseSummary> => {
    const res = await apiClient.get('/business/expenses/summary', { params: { from, to } });
    return res.data;
  },

  createExpense: async (data: ExpenseInput): Promise<Expense> => {
    const res = await apiClient.post('/business/expenses', data);
    return res.data;
  },

  updateExpense: async (id: number, data: Partial<ExpenseInput>): Promise<Expense> => {
    const res = await apiClient.patch(`/business/expenses/${id}`, data);
    return res.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/business/expenses/${id}`);
  },

  /**
   * Downloads a CSV for the accountant. The request goes through the same authenticated client as everything else (the
   * session lives in a cookie), is read as a file, and is saved under the name the server chose. Resolves to that name;
   * rejects with an Error whose message is safe to show.
   */
  downloadExport: async (kind: ExportKind, range?: { from: string; to: string }): Promise<string> => {
    const fallbackName = `shelflyd-${kind}.csv`;
    try {
      const res = await apiClient.get(`/business/exports/${kind}.csv`, {
        params: range ? { from: range.from, to: range.to } : undefined,
        responseType: 'blob',
      });
      const name = filenameFrom(res.headers['content-disposition'] as string | undefined) ?? fallbackName;
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return name;
    } catch (error) {
      throw new Error(await blobErrorMessage(error, 'Could not download this report. Try again in a moment.'));
    }
  },
};
