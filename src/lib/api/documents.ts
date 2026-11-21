import apiClient from './client';
import type { DocumentDto, DocumentType, InvoicingSettings } from '@/types/documents';

export const documentsApi = {
  /** Seller: one document for an order of their business. Credit notes exist only for cancelled or refunded orders. */
  getSellerDocument: async (orderId: number, type: DocumentType): Promise<DocumentDto> => {
    const res = await apiClient.get(`/business/orders/${orderId}/documents/${type}`);
    return res.data;
  },

  /** Buyer: the receipt for an order they placed. */
  getBuyerReceipt: async (orderId: number): Promise<DocumentDto> => {
    const res = await apiClient.get(`/orders/${orderId}/documents/receipt`);
    return res.data;
  },

  getInvoicing: async (): Promise<InvoicingSettings> => {
    const res = await apiClient.get('/business/settings/invoicing');
    return res.data;
  },

  saveInvoicing: async (data: InvoicingSettings): Promise<InvoicingSettings> => {
    const res = await apiClient.put('/business/settings/invoicing', data);
    return res.data;
  },
};
