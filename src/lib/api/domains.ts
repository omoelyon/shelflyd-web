import apiClient from './client';
import type {
  DomainPurchaseStatusInfo,
  DomainSearchResponse,
  DomainState,
  PurchaseDomainRequest,
  PurchaseDomainResponse,
} from '@/types';

export const domainsApi = {
  /** Owner/team: whether custom domains are on, and the store's domain (if any) with what is still to do. */
  getState: async (): Promise<DomainState> => {
    const res = await apiClient.get('/business/domain');
    return res.data;
  },

  /** Owner: start connecting a domain they already own. */
  connect: async (hostname: string): Promise<DomainState> => {
    const res = await apiClient.post('/business/domain', { hostname });
    return res.data;
  },

  /** Owner: look for the domain's DNS records again right now. */
  check: async (): Promise<DomainState> => {
    const res = await apiClient.post('/business/domain/check');
    return res.data;
  },

  /** Owner: remove a connected domain; the store goes back to its Shelflyd address. */
  remove: async (): Promise<DomainState> => {
    const res = await apiClient.delete('/business/domain');
    return res.data;
  },

  /** Owner: which domains are free to buy, with their yearly price in naira. */
  search: async (query: string): Promise<DomainSearchResponse> => {
    const res = await apiClient.get('/business/domain/search', { params: { query } });
    return res.data;
  },

  /** Owner: start buying a domain; the response carries the payment page to send the seller to. */
  purchase: async (data: PurchaseDomainRequest): Promise<PurchaseDomainResponse> => {
    const res = await apiClient.post('/business/domain/purchase', data);
    return res.data;
  },

  /** Owner: after paying, confirm the payment and register the domain. Safe to repeat. */
  completePurchase: async (reference: string): Promise<DomainPurchaseStatusInfo> => {
    const res = await apiClient.post(`/business/domain/purchase/${encodeURIComponent(reference)}/complete`);
    return res.data;
  },

  getPurchase: async (reference: string): Promise<DomainPurchaseStatusInfo> => {
    const res = await apiClient.get(`/business/domain/purchase/${encodeURIComponent(reference)}`);
    return res.data;
  },
};
